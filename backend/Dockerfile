# ========================================
# STAGE 1: Build the Go application
# ========================================
FROM golang:1.25.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first (for better caching)
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the entire source code
COPY . .

# Build the application
# CGO_ENABLED=0 for static binary (no external dependencies)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o barberbook-server .

# ========================================
# STAGE 2: Create minimal runtime image
# ========================================
FROM alpine:latest

# Install runtime dependencies (including postgresql-client for migrations)
RUN apk --no-cache add ca-certificates tzdata curl postgresql-client

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/barberbook-server .

# Copy migrations folder
COPY --from=builder /app/migrations ./migrations

# Copy cmd folder (for migrate tool if needed)
COPY --from=builder /app/cmd ./cmd

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Change ownership to non-root user (except entrypoint which needs to run as root first)
RUN chown -R appuser:appgroup /app

# DON'T switch to non-root user yet - entrypoint needs psql access
# USER appuser will be set in entrypoint.sh after migrations

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Run the application via entrypoint (which runs migrations first)
ENTRYPOINT ["./entrypoint.sh"]
