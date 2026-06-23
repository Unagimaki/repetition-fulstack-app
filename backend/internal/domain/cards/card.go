package cards

import (
	"context"
	"time"

	"repetition-app/backend/internal/domain/repetition"
)

type Card struct {
	ID             string
	Title          string
	FrontText      string
	BackText       string
	Tags           []string
	Level          int
	NextReviewAt   time.Time
	LastReviewedAt *time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type CardInput struct {
	Title     string   `json:"title"`
	FrontText string   `json:"frontText"`
	BackText  string   `json:"backText"`
	Tags      []string `json:"tags"`
}

type ImportedCardInput struct {
	ID           string
	Title        string
	FrontText    string
	BackText     string
	Tags         []string
	Level        int
	NextReviewAt time.Time
	CreatedAt    time.Time
}

type ListFilter struct {
	DueOnly bool
	Search  string
	Tag     string
	Page    int
	PageSize int
}

type ListResult struct {
	Items    []Card
	Total    int
	Page     int
	PageSize int
}

type Repository interface {
	Create(ctx context.Context, input CardInput) (Card, error)
	ImportMany(ctx context.Context, inputs []ImportedCardInput) (int, error)
	Update(ctx context.Context, id string, input CardInput) (Card, error)
	SoftDelete(ctx context.Context, id string) error
	List(ctx context.Context, filter ListFilter) (ListResult, error)
	Due(ctx context.Context, limit int) ([]Card, error)
	Get(ctx context.Context, id string) (Card, error)
	SaveReview(ctx context.Context, id string, level int, nextReviewAt time.Time, reviewedAt time.Time) (Card, error)
	ResetLevel(ctx context.Context, id string, nextReviewAt time.Time) (Card, error)
	SnoozeDue(ctx context.Context, until time.Time) (int64, error)
	CountDueForNotification(ctx context.Context, now time.Time) (int, error)
	MarkDueNotified(ctx context.Context, notifiedAt time.Time, snoozedUntil time.Time) (int64, error)
}

func Review(card Card, result repetition.ReviewResult, now time.Time) (int, time.Time) {
	nextLevel := repetition.ApplyResult(card.Level, result)
	return nextLevel, repetition.NextReviewAt(nextLevel, now)
}
