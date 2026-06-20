package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/text/encoding/charmap"
	carddomain "repetition-app/backend/internal/domain/cards"
)

type learnAppState struct {
	Cards *struct {
		Items []learnAppCard `json:"items"`
	} `json:"cards"`
	Items []learnAppCard `json:"items"`
}

type learnAppCard struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Content      string   `json:"content"`
	CreatedAt    string   `json:"createdAt"`
	Level        int      `json:"level"`
	NextReviewAt *string  `json:"nextReviewAt"`
	Tags         []string `json:"tags"`
}

func (r *Router) importLearnAppCards(w http.ResponseWriter, req *http.Request) {
	var raw json.RawMessage
	if err := readJSON(req, &raw); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	oldCards, err := parseLearnAppCards(raw)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	inputs := make([]carddomain.ImportedCardInput, 0, len(oldCards))
	for _, oldCard := range oldCards {
		nextReviewAt := time.Now().UTC()
		if oldCard.NextReviewAt != nil {
			parsedNextReviewAt := parseOptionalTime(*oldCard.NextReviewAt)
			if !parsedNextReviewAt.IsZero() {
				nextReviewAt = parsedNextReviewAt
			}
		}

		inputs = append(inputs, carddomain.ImportedCardInput{
			ID:           oldCard.ID,
			Title:        repairMojibake(oldCard.Title),
			FrontText:    repairMojibake(oldCard.Title),
			BackText:     repairMojibake(oldCard.Content),
			Tags:         oldCard.Tags,
			Level:        oldCard.Level,
			NextReviewAt: nextReviewAt,
			CreatedAt:    parseOptionalTime(oldCard.CreatedAt),
		})
	}

	count, err := r.cards.ImportMany(req.Context(), inputs)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"imported": count})
}

func parseLearnAppCards(raw json.RawMessage) ([]learnAppCard, error) {
	var cards []learnAppCard
	if err := json.Unmarshal(raw, &cards); err == nil {
		return cards, nil
	}

	var state learnAppState
	if err := json.Unmarshal(raw, &state); err != nil {
		return nil, err
	}

	if state.Cards != nil {
		return state.Cards.Items, nil
	}
	if state.Items != nil {
		return state.Items, nil
	}

	return nil, errors.New("learn-app cards were not found in payload")
}

func parseOptionalTime(value string) time.Time {
	if value == "" {
		return time.Time{}
	}

	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}
	}

	return parsed.UTC()
}

func repairMojibake(value string) string {
	if !looksLikeCP1251Mojibake(value) {
		return value
	}

	bytes, err := charmap.Windows1251.NewEncoder().Bytes([]byte(value))
	if err != nil {
		return value
	}

	if !utf8.Valid(bytes) {
		return value
	}

	repaired := string(bytes)
	if looksLikeCP1251Mojibake(repaired) {
		return value
	}

	return repaired
}

func looksLikeCP1251Mojibake(value string) bool {
	return strings.Contains(value, "Р") || strings.Contains(value, "С") || strings.Contains(value, "вЂ")
}
