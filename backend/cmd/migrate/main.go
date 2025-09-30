package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/config"
	_ "github.com/jackc/pgx/v5/stdlib" // register pgx stdlib driver
	"github.com/pressly/goose/v3"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatalf("usage: migrate [up|down|status|redo|reset]")
	}
	command := os.Args[1]

	cfg := config.Load()
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DB.User, cfg.DB.Password, cfg.DB.Host, cfg.DB.Port, cfg.DB.Name, cfg.DB.SSLMode,
	)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	goose.SetBaseFS(nil)
	migrationsDir := "migrations"

	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("set dialect: %v", err)
	}

	switch command {
	case "up":
		if err := goose.Up(db, migrationsDir); err != nil {
			log.Fatalf("migrate up: %v", err)
		}
	case "down":
		if err := goose.Down(db, migrationsDir); err != nil {
			log.Fatalf("migrate down: %v", err)
		}
	case "status":
		if err := goose.Status(db, migrationsDir); err != nil {
			log.Fatalf("migrate status: %v", err)
		}
	case "redo":
		if err := goose.Redo(db, migrationsDir); err != nil {
			log.Fatalf("migrate redo: %v", err)
		}
	case "reset":
		if err := goose.Reset(db, migrationsDir); err != nil {
			log.Fatalf("migrate reset: %v", err)
		}
	default:
		log.Fatalf("unknown command: %s", command)
	}

	log.Println("ok")
}
