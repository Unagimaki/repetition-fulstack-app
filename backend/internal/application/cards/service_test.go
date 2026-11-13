package cards

import (
	"context"
	"testing"
	"time"

	carddomain "repetition-app/backend/internal/domain/cards"
	"repetition-app/backend/internal/domain/repetition"
)

type recordingRepository struct {
	carddomain.Repository
	card       carddomain.Card
	dueFilter  carddomain.DueFilter
	listFilter carddomain.ListFilter
	wasBacklog bool
}

func (r *recordingRepository) List(_ context.Context, filter carddomain.ListFilter) (carddomain.ListResult, error) {
	r.listFilter = filter
	return carddomain.ListResult{}, nil
}

func TestListTodayUsesSaratovCalendarDay(t *testing.T) {
	for _, hour := range []int{19, 20, 23} {
		t.Run(time.Date(2026, 11, 13, hour, 0, 0, 0, time.UTC).Format(time.RFC3339), func(t *testing.T) {
			now := time.Date(2026, 11, 13, hour, 0, 0, 0, time.UTC)
			repository := &recordingRepository{}
			service := NewService(repository)
			service.now = func() time.Time { return now }
			if _, err := service.List(context.Background(), carddomain.ListFilter{TodayOnly: true}); err != nil {
				t.Fatal(err)
			}
			day := 13
			if hour >= 20 {
				day = 14
			}
			start := time.Date(2026, 11, day, 0, 0, 0, 0, saratovLocation)
			if !repository.listFilter.DayStart.Equal(start) || !repository.listFilter.DayEnd.Equal(start.AddDate(0, 0, 1)) {
				t.Fatalf("unexpected day bounds: %v to %v", repository.listFilter.DayStart, repository.listFilter.DayEnd)
			}
		})
	}
}

func (r *recordingRepository) Due(_ context.Context, filter carddomain.DueFilter) ([]carddomain.Card, error) {
	r.dueFilter = filter
	return nil, nil
}

func (r *recordingRepository) Get(_ context.Context, _ string) (carddomain.Card, error) {
	return r.card, nil
}

func (r *recordingRepository) SaveReview(_ context.Context, _ string, _ int, _ time.Time, _ time.Time, backlog bool) (carddomain.Card, error) {
	r.wasBacklog = backlog
	return r.card, nil
}

func TestDueUsesSaratovDayAndDailyBacklogLimit(t *testing.T) {
	now := time.Date(2026, time.September, 19, 21, 30, 0, 0, time.UTC)
	repository := &recordingRepository{}
	service := NewService(repository)
	service.now = func() time.Time { return now }

	if _, err := service.Due(context.Background(), 20); err != nil {
		t.Fatal(err)
	}

	wantStart := time.Date(2026, time.September, 20, 0, 0, 0, 0, saratovLocation)
	if !repository.dueFilter.DayStart.Equal(wantStart) {
		t.Fatalf("day start = %v, want %v", repository.dueFilter.DayStart, wantStart)
	}
	if !repository.dueFilter.DayEnd.Equal(wantStart.AddDate(0, 0, 1)) {
		t.Fatalf("day end = %v", repository.dueFilter.DayEnd)
	}
	if repository.dueFilter.DailyBacklogLimit != 5 {
		t.Fatalf("daily backlog limit = %d, want 5", repository.dueFilter.DailyBacklogLimit)
	}
}

func TestReviewCountsOldHigherLevelCardAsBacklog(t *testing.T) {
	now := time.Date(2026, time.September, 19, 12, 0, 0, 0, time.UTC)
	repository := &recordingRepository{card: carddomain.Card{
		ID:           "old-card",
		Level:        3,
		NextReviewAt: time.Date(2026, time.September, 18, 12, 0, 0, 0, time.UTC),
	}}
	service := NewService(repository)
	service.now = func() time.Time { return now }

	if _, err := service.Review(context.Background(), "old-card", repetition.Know); err != nil {
		t.Fatal(err)
	}
	if !repository.wasBacklog {
		t.Fatal("old higher-level card was not counted as backlog")
	}
}

func TestReviewDoesNotCountLearningCardAsBacklog(t *testing.T) {
	now := time.Date(2026, time.September, 19, 12, 0, 0, 0, time.UTC)
	repository := &recordingRepository{card: carddomain.Card{
		ID:           "learning-card",
		Level:        2,
		NextReviewAt: time.Date(2026, time.September, 10, 12, 0, 0, 0, time.UTC),
	}}
	service := NewService(repository)
	service.now = func() time.Time { return now }

	if _, err := service.Review(context.Background(), "learning-card", repetition.Know); err != nil {
		t.Fatal(err)
	}
	if repository.wasBacklog {
		t.Fatal("learning card was counted as backlog")
	}
}
