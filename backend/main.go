package main

import (
	"log"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/config"
	mydb "github.com/BirtasevicLazar/BarberBook/backend/internal/db"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/router"
)

func main() {
	// Load config from env/.env
	cfg := config.Load()

	// Connect to database
	pool, err := mydb.Connect(cfg.DB)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	r := router.New(pool, cfg)

	// Run server on :8080 (default)
	if err := r.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
