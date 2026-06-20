package http

import (
	"net/http"

	carddomain "repetition-app/backend/internal/domain/cards"
	"repetition-app/backend/internal/domain/repetition"
)

type reviewRequest struct {
	Result repetition.ReviewResult `json:"result"`
}

func (r *Router) listCards(w http.ResponseWriter, req *http.Request) {
	query := req.URL.Query()
	cards, err := r.cards.List(req.Context(), carddomain.ListFilter{
		DueOnly: query.Get("dueOnly") == "true",
		Search:  query.Get("search"),
		Tag:     query.Get("tag"),
	})
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toCardResponses(cards))
}

func (r *Router) dueCards(w http.ResponseWriter, req *http.Request) {
	cards, err := r.cards.Due(req.Context(), 20)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toCardResponses(cards))
}

func (r *Router) createCard(w http.ResponseWriter, req *http.Request) {
	var input carddomain.CardInput
	if err := readJSON(req, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	card, err := r.cards.Create(req.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toCardResponse(card))
}

func (r *Router) updateCard(w http.ResponseWriter, req *http.Request) {
	var input carddomain.CardInput
	if err := readJSON(req, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	card, err := r.cards.Update(req.Context(), req.PathValue("id"), input)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toCardResponse(card))
}

func (r *Router) deleteCard(w http.ResponseWriter, req *http.Request) {
	if err := r.cards.Delete(req.Context(), req.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}
	writeNoContent(w)
}

func (r *Router) reviewCard(w http.ResponseWriter, req *http.Request) {
	var body reviewRequest
	if err := readJSON(req, &body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if body.Result != repetition.Know && body.Result != repetition.Unsure && body.Result != repetition.DontKnow {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid review result"})
		return
	}

	card, err := r.cards.Review(req.Context(), req.PathValue("id"), body.Result)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toCardResponse(card))
}

func (r *Router) resetCard(w http.ResponseWriter, req *http.Request) {
	card, err := r.cards.Reset(req.Context(), req.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toCardResponse(card))
}
