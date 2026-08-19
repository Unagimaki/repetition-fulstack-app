FROM golang:1.26.2 AS builder

WORKDIR /src

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

# Build a statically linked Linux binary for the api command
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
	go build -ldflags='-s -w' -o /app ./cmd/api

FROM debian:bookworm-slim

# Install CA certs for HTTPS support and keep image small
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

WORKDIR /

ENTRYPOINT ["/app"]