package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func EnsureSchema(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `
		create table if not exists cards (
			id text primary key,
			title text not null,
			front_text text not null,
			back_text text not null,
			level integer not null default 0,
			next_review_at timestamptz not null,
			last_reviewed_at timestamptz,
			notification_snoozed_until timestamptz,
			last_notified_at timestamptz,
			created_at timestamptz not null default now(),
			updated_at timestamptz not null default now(),
			deleted_at timestamptz
		);

		create table if not exists tags (
			id text primary key,
			name text not null unique,
			created_at timestamptz not null default now()
		);

		create table if not exists card_tags (
			card_id text not null references cards(id) on delete cascade,
			tag_id text not null references tags(id) on delete cascade,
			primary key (card_id, tag_id)
		);

		create table if not exists app_settings (
			key text primary key,
			value text not null,
			updated_at timestamptz not null default now()
		);

		create index if not exists idx_cards_next_review_at on cards(next_review_at);
		create index if not exists idx_cards_deleted_next_review on cards(deleted_at, next_review_at);
		create index if not exists idx_card_tags_tag_id on card_tags(tag_id);
	`)
	return err
}
