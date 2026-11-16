package postgres

import (
	"context"
	carddomain "repetition-app/backend/internal/domain/cards"
)

// Both pages use the same eligibility rules and ordering. Future repetitions
// are appended only for the daily schedule ($5).
const reviewQueueCTE = `
 with backlog_usage as (
   select count(*)::integer as used from card_reviews
   where was_backlog and reviewed_at >= $2 and reviewed_at < $3
 ), ranked as (
   select c.*,
     case when c.level <= 2 then 0 when c.next_review_at >= $2 then 1 else 2 end as due_priority,
     row_number() over (
       partition by (c.level >= 3 and c.next_review_at < $2)
       order by c.next_review_at asc, c.created_at asc, c.id asc
     ) as backlog_rank
   from cards c
   where c.deleted_at is null
     and (c.next_review_at <= $1 or ($5 and c.next_review_at >= $2 and c.next_review_at < $3))
 ), queue as (
   select ranked.* from ranked, backlog_usage
   where due_priority < 2 or backlog_rank <= greatest($4 - backlog_usage.used, 0)
 )
`

const reviewQueueColumns = `id, title, front_text, back_text, level, next_review_at,
 last_reviewed_at, created_at, updated_at`

const reviewQueueOrder = `case when next_review_at <= $1 then 0 else 1 end asc,
 due_priority asc,
 case when due_priority = 0 then created_at end desc,
 next_review_at asc, id asc`

func (r *CardRepository) listToday(ctx context.Context, filter carddomain.ListFilter) (carddomain.ListResult, error) {
	args := []any{filter.Now, filter.DayStart, filter.DayEnd, filter.DailyBacklogLimit, true}
	where, args := todayQueueFilters(filter, args)
	var total int
	if err := r.pool.QueryRow(ctx, reviewQueueCTE+`select count(*) from queue`+where, args...).Scan(&total); err != nil {
		return carddomain.ListResult{}, err
	}
	args = append(args, filter.PageSize, (filter.Page-1)*filter.PageSize)
	rows, err := r.pool.Query(ctx, reviewQueueCTE+`select `+reviewQueueColumns+` from queue`+where+` order by `+reviewQueueOrder+` limit $`+itoa(len(args)-1)+` offset $`+itoa(len(args)), args...)
	if err != nil {
		return carddomain.ListResult{}, err
	}
	defer rows.Close()
	cards, err := r.scanCardsWithTags(ctx, rows)
	if err != nil {
		return carddomain.ListResult{}, err
	}
	return carddomain.ListResult{Items: cards, Total: total, Page: filter.Page, PageSize: filter.PageSize}, nil
}

// Filter the completed queue so filters never change the daily backlog limit.
func todayQueueFilters(filter carddomain.ListFilter, args []any) (string, []any) {
	where := " where true"
	if filter.Tag != "" {
		args = append(args, filter.Tag)
		where += ` and exists (select 1 from card_tags ct join tags t on t.id = ct.tag_id where ct.card_id = queue.id and t.name = $` + itoa(len(args)) + `)`
	}
	if filter.Level != nil {
		args = append(args, *filter.Level)
		where += " and queue.level = $" + itoa(len(args))
	}
	return where, args
}
