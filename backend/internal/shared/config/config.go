package config

import (
	"bufio"
	"net"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL string
	Host        string
	Port        string
	CORSOrigins []string
}

func Load() Config {
	loadDotEnv("../.env")
	loadDotEnv(".env")

	return Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://repetition:repetition@localhost:55432/repetition_app?sslmode=disable"),
		Host:        getEnv("BACKEND_HOST", "0.0.0.0"),
		Port:        getEnv("BACKEND_PORT", "14000"),
		CORSOrigins: splitCSV(getEnv("CORS_ORIGINS", "http://localhost:15173")),
	}
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key == "" {
			continue
		}
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, value)
		}
	}
}

func (c Config) HTTPAddress() string {
	return net.JoinHostPort(c.Host, c.Port)
}

func getEnv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func EnvInt(key string, fallback int) int {
	value, err := strconv.Atoi(strings.TrimSpace(os.Getenv(key)))
	if err != nil {
		return fallback
	}
	return value
}
