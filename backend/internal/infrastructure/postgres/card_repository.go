package postgres

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	carddomain "repetition-app/backend/internal/domain/cards"
	"repetition-app/backend/internal/domain/repetition"
)

type CardRepository struct {
	pool *pgxpool.Pool
}

func NewCardRepository(pool *pgxpool.Pool) *CardRepository {
	return &CardRepository{pool: pool}
}

func (r *CardRepository) Create(ctx context.Context, input carddomain.CardInput) (carddomain.Card, error) {
	id, err := newID()
	if err != nil {
		return carddomain.Card{}, err
	}

	now := time.Now().UTC()
	nextReviewAt := repetition.NextReviewAt(0, now)

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return carddomain.Card{}, err
	}
	defer rollback(ctx, tx)

	_, err = tx.Exec(ctx, `
		insert into cards (id, title, front_text, back_text, level, next_review_at, created_at, updated_at)
		values ($1, $2, $3, $4, 0, $5, $6, $6)
	`, id, input.Title, input.FrontText, input.BackText, nextReviewAt, now)
	if err != nil {
		return carddomain.Card{}, err
	}

	if err := replaceTags(ctx, tx, id, input.Tags); err != nil {
		return carddomain.Card{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return carddomain.Card{}, err
	}

	return r.Get(ctx, id)
}

func (r *CardRepository) ImportMany(ctx context.Context, inputs []carddomain.ImportedCardInput) (int, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer rollback(ctx, tx)

	imported := 0
	for _, input := range inputs {
		id := input.ID
		if id == "" {
			id, err = newID()
			if err != nil {
				return 0, err
			}
		}

		now := time.Now().UTC()
		_, err = tx.Exec(ctx, `
			insert into cards (
				id, title, front_text, back_text, level, next_review_at,
				created_at, updated_at, deleted_at
			)
			values ($1, $2, $3, $4, $5, $6, $7, $8, null)
			on conflict (id)
			do update set
				title = excluded.title,
				front_text = excluded.front_text,
				back_text = excluded.back_text,
				level = excluded.level,
				next_review_at = excluded.next_review_at,
				updated_at = excluded.updated_at,
				deleted_at = null
		`, id, input.Title, input.FrontText, input.BackText, repetition.ClampLevel(input.Level), input.NextReviewAt, input.CreatedAt, now)
		if err != nil {
			return 0, err
		}

		if err := replaceTags(ctx, tx, id, input.Tags); err != nil {
			return 0, err
		}
		imported++
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return imported, nil
}

func (r *CardRepository) Update(ctx context.Context, id string, input carddomain.CardInput) (carddomain.Card, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return carddomain.Card{}, err
	}
	defer rollback(ctx, tx)

	tag, err := tx.Exec(ctx, `
		update cards
		set title = $2, front_text = $3, back_text = $4, updated_at = $5
		where id = $1 and deleted_at is null
	`, id, input.Title, input.FrontText, input.BackText, time.Now().UTC())
	if err != nil {
		return carddomain.Card{}, err
	}
	if tag.RowsAffected() == 0 {
		return carddomain.Card{}, pgx.ErrNoRows
	}

	if err := replaceTags(ctx, tx, id, input.Tags); err != nil {
		return carddomain.Card{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return carddomain.Card{}, err
	}

	return r.Get(ctx, id)
}

func (r *CardRepository) SoftDelete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `
		update cards set deleted_at = $2, updated_at = $2
		where id = $1 and deleted_at is null
	`, id, time.Now().UTC())
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *CardRepository) List(ctx context.Context, filter carddomain.ListFilter) ([]carddomain.Card, error) {
	where := []string{"c.deleted_at is null"}
	args := []any{}

	if filter.DueOnly {
		args = append(args, time.Now().UTC())
		where = append(where, "c.next_review_at <= $"+itoa(len(args)))
	}
	if filter.Search != "" {
		args = append(args, "%"+filter.Search+"%")
		position := "$" + itoa(len(args))
		where = append(where, "(c.title ilike "+position+" or c.front_text ilike "+position+" or c.back_text ilike "+position+")")
	}
	if filter.Tag != "" {
		args = append(args, filter.Tag)
		where = append(where, `exists (
			select 1 from card_tags ct
			join tags t on t.id = ct.tag_id
			where ct.card_id = c.id and t.name = $`+itoa(len(args))+`
		)`)
	}

	query := `
		select c.id, c.title, c.front_text, c.back_text, c.level, c.next_review_at,
			c.last_reviewed_at, c.created_at, c.updated_at
		from cards c
		where ` + strings.Join(where, " and ") + `
		order by c.next_review_at asc, c.created_at desc
	`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanCardsWithTags(ctx, rows)
}

func (r *CardRepository) Due(ctx context.Context, limit int) ([]carddomain.Card, error) {
	rows, err := r.pool.Query(ctx, `
		select id, title, front_text, back_text, level, next_review_at,
			last_reviewed_at, created_at, updated_at
		from cards
		where deleted_at is null and next_review_at <= $1
		order by next_review_at asc, created_at asc
		limit $2
	`, time.Now().UTC(), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanCardsWithTags(ctx, rows)
}

func (r *CardRepository) Get(ctx context.Context, id string) (carddomain.Card, error) {
	row := r.pool.QueryRow(ctx, `
		select id, title, front_text, back_text, level, next_review_at,
			last_reviewed_at, created_at, updated_at
		from cards
		where id = $1 and deleted_at is null
	`, id)

	card, err := scanCard(row)
	if err != nil {
		return carddomain.Card{}, err
	}

	tags, err := r.tagsForCard(ctx, id)
	if err != nil {
		return carddomain.Card{}, err
	}
	card.Tags = tags
	return card, nil
}

func (r *CardRepository) SaveReview(ctx context.Context, id string, level int, nextReviewAt time.Time, reviewedAt time.Time) (carddomain.Card, error) {
	tag, err := r.pool.Exec(ctx, `
		update cards
		set level = $2, next_review_at = $3, last_reviewed_at = $4,
			notification_snoozed_until = null, updated_at = $4
		where id = $1 and deleted_at is null
	`, id, level, nextReviewAt, reviewedAt)
	if err != nil {
		return carddomain.Card{}, err
	}
	if tag.RowsAffected() == 0 {
		return carddomain.Card{}, pgx.ErrNoRows
	}
	return r.Get(ctx, id)
}

func (r *CardRepository) ResetLevel(ctx context.Context, id string, nextReviewAt time.Time) (carddomain.Card, error) {
	tag, err := r.pool.Exec(ctx, `
		update cards
		set level = 0, next_review_at = $2, notification_snoozed_until = null, updated_at = $3
		where id = $1 and deleted_at is null
	`, id, nextReviewAt, time.Now().UTC())
	if err != nil {
		return carddomain.Card{}, err
	}
	if tag.RowsAffected() == 0 {
		return carddomain.Card{}, pgx.ErrNoRows
	}
	return r.Get(ctx, id)
}

func (r *CardRepository) SnoozeDue(ctx context.Context, until time.Time) (int64, error) {
	tag, err := r.pool.Exec(ctx, `
		update cards
		set notification_snoozed_until = $2, updated_at = $2
		where deleted_at is null and next_review_at <= $1
	`, time.Now().UTC(), until)
	return tag.RowsAffected(), err
}

func (r *CardRepository) CountDueForNotification(ctx context.Context, now time.Time) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		select count(*)
		from cards
		where deleted_at is null
			and next_review_at <= $1
			and (last_notified_at is null or last_notified_at < next_review_at)
			and (notification_snoozed_until is null or notification_snoozed_until <= $1)
	`, now).Scan(&count)
	return count, err
}

func (r *CardRepository) MarkDueNotified(ctx context.Context, notifiedAt time.Time, snoozedUntil time.Time) (int64, error) {
	tag, err := r.pool.Exec(ctx, `
		update cards
		set last_notified_at = $1, notification_snoozed_until = $2, updated_at = $1
		where deleted_at is null
			and next_review_at <= $1
			and (last_notified_at is null or last_notified_at < next_review_at)
			and (notification_snoozed_until is null or notification_snoozed_until <= $1)
	`, notifiedAt, snoozedUntil)
	return tag.RowsAffected(), err
}

func (r *CardRepository) scanCardsWithTags(ctx context.Context, rows pgx.Rows) ([]carddomain.Card, error) {
	cards := []carddomain.Card{}
	for rows.Next() {
		card, err := scanCard(rows)
		if err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}

	for index := range cards {
		tags, err := r.tagsForCard(ctx, cards[index].ID)
		if err != nil {
			return nil, err
		}
		cards[index].Tags = tags
	}

	return cards, nil
}

func (r *CardRepository) tagsForCard(ctx context.Context, cardID string) ([]string, error) {
	rows, err := r.pool.Query(ctx, `
		select t.name
		from tags t
		join card_tags ct on ct.tag_id = t.id
		where ct.card_id = $1
		order by t.name asc
	`, cardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := []string{}
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, rows.Err()
}

type scanner interface {
	Scan(dest ...any) error
}

func scanCard(row scanner) (carddomain.Card, error) {
	var card carddomain.Card
	err := row.Scan(
		&card.ID,
		&card.Title,
		&card.FrontText,
		&card.BackText,
		&card.Level,
		&card.NextReviewAt,
		&card.LastReviewedAt,
		&card.CreatedAt,
		&card.UpdatedAt,
	)
	return card, err
}

func replaceTags(ctx context.Context, tx pgx.Tx, cardID string, tags []string) error {
	if _, err := tx.Exec(ctx, "delete from card_tags where card_id = $1", cardID); err != nil {
		return err
	}

	for _, name := range tags {
		tagID, err := ensureTag(ctx, tx, name)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			insert into card_tags (card_id, tag_id)
			values ($1, $2)
			on conflict do nothing
		`, cardID, tagID); err != nil {
			return err
		}
	}

	return nil
}

func ensureTag(ctx context.Context, tx pgx.Tx, name string) (string, error) {
	var id string
	err := tx.QueryRow(ctx, "select id from tags where name = $1", name).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	id, err = newID()
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(ctx, `
		insert into tags (id, name)
		values ($1, $2)
		on conflict (name) do nothing
	`, id, name)
	if err != nil {
		return "", err
	}

	err = tx.QueryRow(ctx, "select id from tags where name = $1", name).Scan(&id)
	return id, err
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func itoa(value int) string {
	if value == 0 {
		return "0"
	}
	digits := [20]byte{}
	index := len(digits)
	for value > 0 {
		index--
		digits[index] = byte('0' + value%10)
		value /= 10
	}
	return string(digits[index:])
}
