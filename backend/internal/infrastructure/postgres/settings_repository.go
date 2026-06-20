package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SettingsRepository struct {
	pool *pgxpool.Pool
}

func NewSettingsRepository(pool *pgxpool.Pool) *SettingsRepository {
	return &SettingsRepository{pool: pool}
}

func (r *SettingsRepository) Get(ctx context.Context, key string) (string, error) {
	var value string
	err := r.pool.QueryRow(ctx, "select value from app_settings where key = $1", key).Scan(&value)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	return value, err
}

func (r *SettingsRepository) Set(ctx context.Context, key string, value string) error {
	_, err := r.pool.Exec(ctx, `
		insert into app_settings (key, value, updated_at)
		values ($1, $2, $3)
		on conflict (key)
		do update set value = excluded.value, updated_at = excluded.updated_at
	`, key, value, time.Now().UTC())
	return err
}
