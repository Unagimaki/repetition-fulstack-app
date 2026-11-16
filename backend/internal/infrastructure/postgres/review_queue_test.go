package postgres

import (
	"context"
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	carddomain "repetition-app/backend/internal/domain/cards"
)

func TestTodayStartsWithHomeQueue(t *testing.T) {
	url := os.Getenv("QUEUE_TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set QUEUE_TEST_DATABASE_URL to run PostgreSQL queue regression test")
	}
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(ctx)
	// Temporary tables isolate the regression scenarios from application data.
	_, err = conn.Exec(ctx, `
 create temporary table cards (id text, level integer, next_review_at timestamptz, created_at timestamptz, deleted_at timestamptz);
 create temporary table card_reviews (was_backlog boolean, reviewed_at timestamptz);
 create temporary table tags (id text, name text);
 create temporary table card_tags (card_id text, tag_id text);
 insert into tags values ('tag-1', 'go');
 insert into card_tags values ('new-learning', 'tag-1'), ('future-learning', 'tag-1'), ('backlog-second', 'tag-1');
 insert into cards (id, level, next_review_at, created_at) values
 ('old-learning', 1, '2026-11-15 08:00Z', '2026-11-15 07:00Z'),
 ('new-learning', 0, '2026-11-16 08:00Z', '2026-11-16 07:00Z'),
 ('today-mature', 4, '2026-11-16 06:00Z', '2026-10-01 07:00Z'),
 ('backlog-first', 4, '2026-11-13 06:00Z', '2026-10-01 07:00Z'),
 ('backlog-second', 4, '2026-11-14 06:00Z', '2026-10-01 07:00Z'),
 ('future-learning', 0, '2026-11-16 15:00Z', '2026-11-16 09:00Z'),
 ('tomorrow', 0, '2026-11-16 20:00Z', '2026-11-16 09:00Z');`)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 11, 16, 10, 0, 0, 0, time.UTC)
	start := time.Date(2026, 11, 15, 20, 0, 0, 0, time.UTC)
	for _, used := range []int{0, 1} {
		if used == 1 {
			if _, err := conn.Exec(ctx, `insert into card_reviews values (true, $1)`, now); err != nil {
				t.Fatal(err)
			}
		}
		read := func(future bool) []string {
			rows, err := conn.Query(ctx, reviewQueueCTE+`select id from queue order by `+reviewQueueOrder, now, start, start.Add(24*time.Hour), 1, future)
			if err != nil {
				t.Fatal(err)
			}
			defer rows.Close()
			ids, err := pgx.CollectRows(rows, pgx.RowTo[string])
			if err != nil {
				t.Fatal(err)
			}
			return ids
		}
		home := read(false)
		want := []string{"new-learning", "old-learning", "today-mature"}
		if used == 0 {
			want = append(want, "backlog-first")
		}
		if !reflect.DeepEqual(home, want) {
			t.Fatalf("home = %v, want %v", home, want)
		}
		today := read(true)
		want = append(want, "future-learning")
		if !reflect.DeepEqual(today, want) {
			t.Fatalf("today = %v, want %v", today, want)
		}
		zero := 0
		four := 4
		cases := []struct {
			name   string
			filter carddomain.ListFilter
			want   []string
		}{
			{"tag", carddomain.ListFilter{Tag: "go"}, []string{"new-learning", "future-learning"}},
			{"level zero", carddomain.ListFilter{Level: &zero}, []string{"new-learning", "future-learning"}},
			{"combined", carddomain.ListFilter{Tag: "go", Level: &zero}, []string{"new-learning", "future-learning"}},
			{"no matches", carddomain.ListFilter{Tag: "missing"}, []string{}},
			{"backlog stays limited", carddomain.ListFilter{Tag: "go", Level: &four}, []string{}},
		}
		for _, tc := range cases {
			where, args := todayQueueFilters(tc.filter, []any{now, start, start.Add(24 * time.Hour), 1, true})
			rows, err := conn.Query(ctx, reviewQueueCTE+`select id from queue`+where+` order by `+reviewQueueOrder, args...)
			if err != nil {
				t.Fatal(err)
			}
			ids, err := pgx.CollectRows(rows, pgx.RowTo[string])
			if err != nil {
				t.Fatal(err)
			}
			if !reflect.DeepEqual(ids, tc.want) {
				t.Fatalf("%s: got %v, want %v", tc.name, ids, tc.want)
			}
			var count int
			if err := conn.QueryRow(ctx, reviewQueueCTE+`select count(*) from queue`+where, args...).Scan(&count); err != nil {
				t.Fatal(err)
			}
			if count != len(tc.want) {
				t.Fatalf("%s: count = %d, want %d", tc.name, count, len(tc.want))
			}
			if count > 1 {
				args = append(args, 1, 1)
				rows, err := conn.Query(ctx, reviewQueueCTE+`select id from queue`+where+` order by `+reviewQueueOrder+` limit $`+itoa(len(args)-1)+` offset $`+itoa(len(args)), args...)
				if err != nil {
					t.Fatal(err)
				}
				page, err := pgx.CollectRows(rows, pgx.RowTo[string])
				if err != nil {
					t.Fatal(err)
				}
				if !reflect.DeepEqual(page, tc.want[1:2]) {
					t.Fatalf("%s: unexpected second page %v", tc.name, page)
				}
			}
		}
	}
}
