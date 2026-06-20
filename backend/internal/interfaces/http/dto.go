package http

import (
	"time"

	carddomain "repetition-app/backend/internal/domain/cards"
	"repetition-app/backend/internal/domain/repetition"
)

type cardResponse struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	FrontText      string   `json:"frontText"`
	BackText       string   `json:"backText"`
	Tags           []string `json:"tags"`
	Level          int      `json:"level"`
	LevelLabel     string   `json:"levelLabel"`
	NextReviewAt   string   `json:"nextReviewAt"`
	LastReviewedAt *string  `json:"lastReviewedAt"`
	CreatedAt      string   `json:"createdAt"`
	UpdatedAt      string   `json:"updatedAt"`
}

func toCardResponse(card carddomain.Card) cardResponse {
	var lastReviewedAt *string
	if card.LastReviewedAt != nil {
		value := card.LastReviewedAt.UTC().Format(time.RFC3339)
		lastReviewedAt = &value
	}

	return cardResponse{
		ID:             card.ID,
		Title:          card.Title,
		FrontText:      card.FrontText,
		BackText:       card.BackText,
		Tags:           card.Tags,
		Level:          card.Level,
		LevelLabel:     repetition.LevelLabel(card.Level),
		NextReviewAt:   card.NextReviewAt.UTC().Format(time.RFC3339),
		LastReviewedAt: lastReviewedAt,
		CreatedAt:      card.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:      card.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func toCardResponses(cards []carddomain.Card) []cardResponse {
	response := make([]cardResponse, 0, len(cards))
	for _, card := range cards {
		response = append(response, toCardResponse(card))
	}
	return response
}
