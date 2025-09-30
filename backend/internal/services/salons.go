package services

import (
	"context"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type SalonsService struct {
	db *pgxpool.Pool
}

func NewSalonsService(db *pgxpool.Pool) *SalonsService {
	return &SalonsService{db: db}
}

type CreateSalonOwnerInput struct {
	// Owner fields
	Email    string
	Password string
	FullName string
	Phone    *string

	// Salon fields
	Name       string
	SalonPhone string
	Address    string
	Timezone   string
	Currency   string
}

type CreateSalonOwnerResult struct {
	Owner models.User
	Salon models.Salon
}

func (s *SalonsService) CreateSalonWithOwner(ctx context.Context, in CreateSalonOwnerInput) (CreateSalonOwnerResult, error) {
	tx, err := s.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return CreateSalonOwnerResult{}, err
	}
	defer func() {
		if tx != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return CreateSalonOwnerResult{}, err
	}

	// Insert owner user
	var ownerID uuid.UUID
	var createdAt time.Time
	var phoneOut *string
	err = tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, full_name, phone, role)
         VALUES ($1, $2, $3, $4, 'owner')
         RETURNING id, created_at, phone`,
		in.Email, string(hash), in.FullName, in.Phone,
	).Scan(&ownerID, &createdAt, &phoneOut)
	if err != nil {
		// Unique violation (email)
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return CreateSalonOwnerResult{}, err
		}
		return CreateSalonOwnerResult{}, err
	}

	// Default values for salon fields
	if in.Timezone == "" {
		in.Timezone = "Europe/Belgrade"
	}
	if in.Currency == "" {
		in.Currency = "RSD"
	}

	// Insert salon
	var salonID uuid.UUID
	var salonCreated time.Time
	err = tx.QueryRow(ctx,
		`INSERT INTO salons (name, phone, address, timezone, currency, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
		in.Name, in.SalonPhone, in.Address, in.Timezone, in.Currency, ownerID,
	).Scan(&salonID, &salonCreated)
	if err != nil {
		return CreateSalonOwnerResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return CreateSalonOwnerResult{}, err
	}
	tx = nil

	owner := models.User{
		ID:           ownerID,
		Email:        in.Email,
		PasswordHash: "", // not exposed
		FullName:     in.FullName,
		Phone:        phoneOut,
		Role:         "owner",
		CreatedAt:    createdAt,
	}
	salon := models.Salon{
		ID:        salonID,
		Name:      in.Name,
		Phone:     in.SalonPhone,
		Address:   in.Address,
		Timezone:  in.Timezone,
		Currency:  in.Currency,
		OwnerID:   ownerID,
		CreatedAt: salonCreated,
	}
	return CreateSalonOwnerResult{Owner: owner, Salon: salon}, nil
}
