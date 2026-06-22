package http

import (
	"context"
	"net/http"
	"strings"

	appcards "repetition-app/backend/internal/application/cards"
	"repetition-app/backend/internal/domain/settings"
)

type tagLister interface {
	List(ctx context.Context) ([]string, error)
}

type Router struct {
	cards       *appcards.Service
	tags        tagLister
	settings    settings.Repository
	corsOrigins map[string]struct{}
	mux         *http.ServeMux
}

func NewRouter(cards *appcards.Service, tags tagLister, settings settings.Repository, corsOrigins []string) http.Handler {
	router := &Router{
		cards:       cards,
		tags:        tags,
		settings:    settings,
		corsOrigins: map[string]struct{}{},
		mux:         http.NewServeMux(),
	}
	for _, origin := range corsOrigins {
		router.corsOrigins[origin] = struct{}{}
	}
	router.routes()
	return router
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.withCORS(r.mux).ServeHTTP(w, req)
}

func (r *Router) routes() {
	r.mux.HandleFunc("GET /health", r.health)
	r.mux.HandleFunc("GET /api/cards", r.listCards)
	r.mux.HandleFunc("GET /api/cards/due", r.dueCards)
	r.mux.HandleFunc("POST /api/cards", r.createCard)
	r.mux.HandleFunc("PUT /api/cards/{id}", r.updateCard)
	r.mux.HandleFunc("DELETE /api/cards/{id}", r.deleteCard)
	r.mux.HandleFunc("POST /api/cards/{id}/review", r.reviewCard)
	r.mux.HandleFunc("POST /api/cards/{id}/reset", r.resetCard)
	r.mux.HandleFunc("GET /api/tags", r.listTags)
	r.mux.HandleFunc("POST /api/import/learn-app", r.importLearnAppCards)
	r.mux.HandleFunc("POST /api/telegram/start", r.telegramStart)
	r.mux.HandleFunc("GET /api/telegram/chat", r.telegramChat)
	r.mux.HandleFunc("GET /api/telegram/due", r.telegramDue)
	r.mux.HandleFunc("GET /api/telegram/notification-due", r.telegramNotificationDue)
	r.mux.HandleFunc("POST /api/telegram/notify-due", r.telegramNotifyDue)
	r.mux.HandleFunc("POST /api/telegram/snooze", r.telegramSnooze)
}

func (r *Router) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		origin := req.Header.Get("Origin")
		if origin != "" {
			if _, allowed := r.corsOrigins[origin]; allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
				w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			}
		}

		if strings.EqualFold(req.Method, http.MethodOptions) {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, req)
	})
}

func (r *Router) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (r *Router) listTags(w http.ResponseWriter, req *http.Request) {
	tags, err := r.tags.List(req.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, tags)
}
