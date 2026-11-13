package cards

import (
	"context"
	"strings"
	"time"

	carddomain "repetition-app/backend/internal/domain/cards"
	"repetition-app/backend/internal/domain/repetition"
)

type Service struct {
	repository carddomain.Repository
	now        func() time.Time
}

func NewService(repository carddomain.Repository) *Service {
	return &Service{repository: repository, now: time.Now}
}

const dailyBacklogLimit = 5

var saratovLocation = time.FixedZone("Europe/Saratov", 4*60*60)

func (s *Service) Create(ctx context.Context, input carddomain.CardInput) (carddomain.Card, error) {
	return s.repository.Create(ctx, normalizeInput(input))
}

func (s *Service) ImportMany(ctx context.Context, inputs []carddomain.ImportedCardInput) (int, error) {
	normalized := make([]carddomain.ImportedCardInput, 0, len(inputs))
	for _, input := range inputs {
		cardInput := normalizeInput(carddomain.CardInput{
			Title:     input.Title,
			FrontText: input.FrontText,
			BackText:  input.BackText,
			Tags:      input.Tags,
		})
		if cardInput.Title == "" || cardInput.BackText == "" {
			continue
		}
		input.Title = cardInput.Title
		input.FrontText = cardInput.FrontText
		input.BackText = cardInput.BackText
		input.Tags = cardInput.Tags
		if input.FrontText == "" {
			input.FrontText = input.Title
		}
		if input.NextReviewAt.IsZero() {
			input.NextReviewAt = time.Now().UTC()
		}
		if input.CreatedAt.IsZero() {
			input.CreatedAt = time.Now().UTC()
		}
		normalized = append(normalized, input)
	}

	return s.repository.ImportMany(ctx, normalized)
}

func (s *Service) Update(ctx context.Context, id string, input carddomain.CardInput) (carddomain.Card, error) {
	return s.repository.Update(ctx, id, normalizeInput(input))
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repository.SoftDelete(ctx, id)
}

func (s *Service) List(ctx context.Context, filter carddomain.ListFilter) (carddomain.ListResult, error) {
	if filter.TodayOnly {
		filter.DayStart, filter.DayEnd = saratovDay(s.now())
	}
	filter.Search = strings.TrimSpace(filter.Search)
	filter.Tag = strings.ToLower(strings.TrimSpace(filter.Tag))
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.PageSize <= 0 {
		filter.PageSize = 12
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}
	return s.repository.List(ctx, filter)
}

func (s *Service) Due(ctx context.Context, limit int) ([]carddomain.Card, error) {
	if limit <= 0 {
		limit = 20
	}
	now := s.now()
	dayStart, dayEnd := saratovDay(now)
	return s.repository.Due(ctx, carddomain.DueFilter{
		Now:               now,
		DayStart:          dayStart,
		DayEnd:            dayEnd,
		Limit:             limit,
		DailyBacklogLimit: dailyBacklogLimit,
	})
}

func (s *Service) Review(ctx context.Context, id string, result repetition.ReviewResult) (carddomain.Card, error) {
	card, err := s.repository.Get(ctx, id)
	if err != nil {
		return carddomain.Card{}, err
	}

	now := s.now()
	level, nextReviewAt := carddomain.Review(card, result, now)
	dayStart, _ := saratovDay(now)
	backlog := card.Level >= 3 && card.NextReviewAt.Before(dayStart)
	return s.repository.SaveReview(ctx, id, level, nextReviewAt, now, backlog)
}

func (s *Service) Reset(ctx context.Context, id string) (carddomain.Card, error) {
	return s.repository.ResetLevel(ctx, id, repetition.NextReviewAt(0, time.Now().UTC()))
}

func (s *Service) SnoozeDue(ctx context.Context, minutes int) (int64, error) {
	if minutes <= 0 {
		minutes = 10
	}
	return s.repository.SnoozeDue(ctx, time.Now().UTC().Add(time.Duration(minutes)*time.Minute))
}

func (s *Service) CountDueForNotification(ctx context.Context) (int, error) {
	return s.repository.CountDueForNotification(ctx, time.Now().UTC())
}

func (s *Service) MarkDueNotified(ctx context.Context, minutes int) (int64, error) {
	if minutes <= 0 {
		minutes = 10
	}
	now := time.Now().UTC()
	return s.repository.MarkDueNotified(ctx, now, now.Add(time.Duration(minutes)*time.Minute))
}

func normalizeInput(input carddomain.CardInput) carddomain.CardInput {
	seen := map[string]struct{}{}
	tags := make([]string, 0, len(input.Tags))
	for _, tag := range input.Tags {
		normalized := strings.ToLower(strings.TrimSpace(tag))
		if normalized == "" {
			continue
		}
		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		tags = append(tags, normalized)
	}

	return carddomain.CardInput{
		Title:     strings.TrimSpace(input.Title),
		FrontText: strings.TrimSpace(input.FrontText),
		BackText:  strings.TrimSpace(input.BackText),
		Tags:      tags,
	}
}

func saratovDay(now time.Time) (time.Time, time.Time) {
	local := now.In(saratovLocation)
	start := time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, saratovLocation)
	return start, start.AddDate(0, 0, 1)
}
