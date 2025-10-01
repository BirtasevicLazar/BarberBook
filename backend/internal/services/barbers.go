package services

import (
	"context"
	"errors"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type BarbersService struct {
	db *pgxpool.Pool
}

func NewBarbersService(db *pgxpool.Pool) *BarbersService { return &BarbersService{db: db} }

type AddBarberInput struct {
	SalonID             uuid.UUID
	Email               string
	Password            string
	FullName            string
	Phone               *string
	DisplayName         string
	SlotDurationMinutes int
}

type AddBarberResult struct {
	UserID uuid.UUID
	Barber models.Barber
}

// AddBarber creates a user (role=barber) and a barber row in a transaction.
func (s *BarbersService) AddBarber(ctx context.Context, in AddBarberInput) (AddBarberResult, error) {
	tx, err := s.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return AddBarberResult{}, err
	}
	defer func() {
		if tx != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	if in.SlotDurationMinutes <= 0 {
		return AddBarberResult{}, errors.New("invalid slot duration")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return AddBarberResult{}, err
	}

	var userID uuid.UUID
	var createdAt time.Time
	var phoneOut *string
	// Create user with role=barber
	if err := tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, full_name, phone, role)
		 VALUES ($1,$2,$3,$4,'barber') RETURNING id, created_at, phone`,
		in.Email, string(hash), in.FullName, in.Phone,
	).Scan(&userID, &createdAt, &phoneOut); err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" { // unique violation email
			return AddBarberResult{}, err
		}
		return AddBarberResult{}, err
	}

	var barberID uuid.UUID
	var barberCreated time.Time
	// Create barber row
	if err := tx.QueryRow(ctx,
		`INSERT INTO barbers (user_id, salon_id, display_name, slot_duration_minutes)
		 VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
		userID, in.SalonID, in.DisplayName, in.SlotDurationMinutes,
	).Scan(&barberID, &barberCreated); err != nil {
		return AddBarberResult{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return AddBarberResult{}, err
	}
	tx = nil

	return AddBarberResult{
		UserID: userID,
		Barber: models.Barber{
			ID:                  barberID,
			UserID:              userID,
			SalonID:             in.SalonID,
			DisplayName:         in.DisplayName,
			Active:              true,
			SlotDurationMinutes: in.SlotDurationMinutes,
			CreatedAt:           barberCreated,
		},
	}, nil
}

// ListBarbers returns all barbers for a salon.
func (s *BarbersService) ListBarbers(ctx context.Context, salonID uuid.UUID) ([]models.Barber, error) {
	rows, err := s.db.Query(ctx, `SELECT id, user_id, salon_id, display_name, active, slot_duration_minutes, created_at FROM barbers WHERE salon_id=$1 ORDER BY created_at`, salonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Barber
	for rows.Next() {
		var b models.Barber
		if err := rows.Scan(&b.ID, &b.UserID, &b.SalonID, &b.DisplayName, &b.Active, &b.SlotDurationMinutes, &b.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// ListActiveBarbers returns only active barbers for a salon (public view).
func (s *BarbersService) ListActiveBarbers(ctx context.Context, salonID uuid.UUID) ([]models.Barber, error) {
	rows, err := s.db.Query(ctx, `SELECT id, user_id, salon_id, display_name, active, slot_duration_minutes, created_at FROM barbers WHERE salon_id=$1 AND active=true ORDER BY display_name`, salonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Barber
	for rows.Next() {
		var b models.Barber
		if err := rows.Scan(&b.ID, &b.UserID, &b.SalonID, &b.DisplayName, &b.Active, &b.SlotDurationMinutes, &b.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// GetBarber returns a single barber by id within a salon.
func (s *BarbersService) GetBarber(ctx context.Context, salonID, barberID uuid.UUID) (models.Barber, error) {
	var b models.Barber
	err := s.db.QueryRow(ctx, `SELECT id, user_id, salon_id, display_name, active, slot_duration_minutes, created_at FROM barbers WHERE id=$1 AND salon_id=$2`, barberID, salonID).
		Scan(&b.ID, &b.UserID, &b.SalonID, &b.DisplayName, &b.Active, &b.SlotDurationMinutes, &b.CreatedAt)
	if err != nil {
		return models.Barber{}, err
	}
	return b, nil
}

// GetBarberByUser returns the barber profile for a given user id (role=barber).
func (s *BarbersService) GetBarberByUser(ctx context.Context, userID uuid.UUID) (models.Barber, error) {
	var b models.Barber
	err := s.db.QueryRow(ctx, `SELECT id, user_id, salon_id, display_name, active, slot_duration_minutes, created_at FROM barbers WHERE user_id=$1`, userID).
		Scan(&b.ID, &b.UserID, &b.SalonID, &b.DisplayName, &b.Active, &b.SlotDurationMinutes, &b.CreatedAt)
	if err != nil {
		return models.Barber{}, err
	}
	return b, nil
}

type UpdateBarberInput struct {
	SalonID             uuid.UUID
	BarberID            uuid.UUID
	DisplayName         string
	Active              bool
	SlotDurationMinutes int
}

func (s *BarbersService) UpdateBarber(ctx context.Context, in UpdateBarberInput) (models.Barber, error) {
	var b models.Barber
	err := s.db.QueryRow(ctx,
		`UPDATE barbers SET display_name=$1, active=$2, slot_duration_minutes=$3 WHERE id=$4 AND salon_id=$5
		 RETURNING id, user_id, salon_id, display_name, active, slot_duration_minutes, created_at`,
		in.DisplayName, in.Active, in.SlotDurationMinutes, in.BarberID, in.SalonID,
	).Scan(&b.ID, &b.UserID, &b.SalonID, &b.DisplayName, &b.Active, &b.SlotDurationMinutes, &b.CreatedAt)
	if err != nil {
		return models.Barber{}, err
	}
	return b, nil
}

// DeactivateBarber marks a barber inactive ("soft delete").
func (s *BarbersService) DeactivateBarber(ctx context.Context, salonID, barberID uuid.UUID) (models.Barber, error) {
	var b models.Barber
	err := s.db.QueryRow(ctx,
		`UPDATE barbers SET active=false WHERE id=$1 AND salon_id=$2
		 RETURNING id, user_id, salon_id, display_name, active, slot_duration_minutes, created_at`,
		barberID, salonID,
	).Scan(&b.ID, &b.UserID, &b.SalonID, &b.DisplayName, &b.Active, &b.SlotDurationMinutes, &b.CreatedAt)
	if err != nil {
		return models.Barber{}, err
	}
	return b, nil
}
