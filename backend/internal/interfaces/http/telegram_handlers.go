package http

import "net/http"

const telegramChatIDKey = "telegram_chat_id"

type telegramStartRequest struct {
	ChatID string `json:"chatId"`
}

func (r *Router) telegramStart(w http.ResponseWriter, req *http.Request) {
	var body telegramStartRequest
	if err := readJSON(req, &body); err != nil || body.ChatID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "chatId is required"})
		return
	}

	if err := r.settings.Set(req.Context(), telegramChatIDKey, body.ChatID); err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (r *Router) telegramChat(w http.ResponseWriter, req *http.Request) {
	chatID, err := r.settings.Get(req.Context(), telegramChatIDKey)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"chatId": chatID})
}

func (r *Router) telegramDue(w http.ResponseWriter, req *http.Request) {
	cards, err := r.cards.Due(req.Context(), 1)
	if err != nil {
		writeError(w, err)
		return
	}

	var card any
	if len(cards) > 0 {
		card = toCardResponse(cards[0])
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"count": len(cards),
		"card":  card,
	})
}

func (r *Router) telegramNotificationDue(w http.ResponseWriter, req *http.Request) {
	count, err := r.cards.CountDueForNotification(req.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"count": count})
}

func (r *Router) telegramNotifyDue(w http.ResponseWriter, req *http.Request) {
	count, err := r.cards.MarkDueNotified(req.Context(), 10)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int64{"count": count})
}

func (r *Router) telegramSnooze(w http.ResponseWriter, req *http.Request) {
	count, err := r.cards.SnoozeDue(req.Context(), 10)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int64{"count": count})
}
