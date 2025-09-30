package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UsersRepository struct {
	db *pgxpool.Pool
}

func NewUsersRepository(db *pgxpool.Pool) *UsersRepository {
	return &UsersRepository{db: db}
}

func (r *UsersRepository) Create(ctx context.Context, email, passwordHash, fullName string, phone *string, role string) (models.User, error) {
	var u models.User
	q := `
        INSERT INTO users (email, password_hash, full_name, phone, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, password_hash, full_name, phone, role, created_at
    `
	row := r.db.QueryRow(ctx, q, email, passwordHash, fullName, phone, role)
	var id uuid.UUID
	var createdAt time.Time
	var phoneOut *string
	if err := row.Scan(&id, &u.Email, &u.PasswordHash, &u.FullName, &phoneOut, &u.Role, &createdAt); err != nil {
		return models.User{}, err
	}
	u.ID = id
	u.Phone = phoneOut
	u.CreatedAt = createdAt
	return u, nil
}

func (r *UsersRepository) GetByEmail(ctx context.Context, email string) (models.User, error) {
	var u models.User
	q := `
        SELECT id, email, password_hash, full_name, phone, role, created_at
        FROM users
        WHERE email = $1
    `
	row := r.db.QueryRow(ctx, q, email)
	var id uuid.UUID
	var createdAt time.Time
	var phoneOut *string
	if err := row.Scan(&id, &u.Email, &u.PasswordHash, &u.FullName, &phoneOut, &u.Role, &createdAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.User{}, err
		}
		return models.User{}, err
	}
	u.ID = id
	u.Phone = phoneOut
	u.CreatedAt = createdAt
	return u, nil
}
