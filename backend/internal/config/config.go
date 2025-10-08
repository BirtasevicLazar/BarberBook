package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type EmailConfig struct {
	Host     string
	Port     string
	Username string
	Password string
}

type Config struct {
	DB        DBConfig
	Email     EmailConfig
	JWTSecret string
}

func Load() Config {
	err := godotenv.Load()
	if err != nil {
		log.Printf("⚠️  Warning: .env file not loaded: %v", err)
	} else {
		log.Println("✅ .env file loaded successfully")
	}

	cfg := Config{
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", ""),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", ""),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Email: EmailConfig{
			Host:     getEnv("MAIL_HOST", "smtp.gmail.com"),
			Port:     getEnv("MAIL_PORT", "587"),
			Username: getEnv("MAIL_USERNAME", ""),
			Password: getEnv("MAIL_PASSWORD", ""),
		},
		JWTSecret: getEnv("JWT_SECRET", "dev-secret-change"),
	}

	if cfg.DB.Host == "" || cfg.DB.User == "" || cfg.DB.Name == "" {
		log.Println("[WARN] Database configuration is incomplete. Check .env or environment variables.")
	}

	// Log email configuration (mask password)
	maskedPassword := ""
	if len(cfg.Email.Password) > 0 {
		maskedPassword = "****" + cfg.Email.Password[len(cfg.Email.Password)-4:]
	}
	log.Printf("📧 Email Config: Host=%s, Port=%s, Username=%s, Password=%s",
		cfg.Email.Host, cfg.Email.Port, cfg.Email.Username, maskedPassword)

	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
