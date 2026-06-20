package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"repetition-app/backend/internal/application/cards"
	"repetition-app/backend/internal/infrastructure/postgres"
	httpapi "repetition-app/backend/internal/interfaces/http"
	"repetition-app/backend/internal/shared/config"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("connect postgres", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := postgres.EnsureSchema(ctx, pool); err != nil {
		logger.Error("ensure schema", "error", err)
		os.Exit(1)
	}

	cardRepo := postgres.NewCardRepository(pool)
	settingsRepo := postgres.NewSettingsRepository(pool)
	cardService := cards.NewService(cardRepo)

	server := &http.Server{
		Addr:              cfg.HTTPAddress(),
		Handler:           httpapi.NewRouter(cardService, settingsRepo, cfg.CORSOrigins),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		logger.Info("backend listening", "addr", cfg.HTTPAddress())
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("listen", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown", "error", err)
	}
}
