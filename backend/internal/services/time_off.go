package services

import (
	"context"
	"errors"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TimeOffService struct{ db *pgxpool.Pool }

func NewTimeOffService(db *pgxpool.Pool) *TimeOffService { return &TimeOffService{db: db} }

type TimeOffInput struct {
	BarberID uuid.UUID
	StartAt  time.Time
	EndAt    time.Time
	Reason   *string
}

func validatePeriod(start, end time.Time) error {
	if !start.Before(end) {
		return errors.New("start_at must be before end_at")
	}
	return nil
}

func (s *TimeOffService) List(ctx context.Context, barberID uuid.UUID) ([]models.BarberTimeOff, error) {
	rows, err := s.db.Query(ctx, `SELECT id, barber_id, start_at, end_at, reason FROM barber_time_off WHERE barber_id=$1 ORDER BY start_at`, barberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.BarberTimeOff
	for rows.Next() {
		var t models.BarberTimeOff
		if err := rows.Scan(&t.ID, &t.BarberID, &t.StartAt, &t.EndAt, &t.Reason); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *TimeOffService) Create(ctx context.Context, in TimeOffInput) (models.BarberTimeOff, error) {
	if err := validatePeriod(in.StartAt, in.EndAt); err != nil {
		return models.BarberTimeOff{}, err
	}
	var t models.BarberTimeOff
	err := s.db.QueryRow(ctx,
		`INSERT INTO barber_time_off (barber_id, start_at, end_at, reason)
         VALUES ($1,$2,$3,$4)
         RETURNING id, barber_id, start_at, end_at, reason`,
		in.BarberID, in.StartAt, in.EndAt, in.Reason,
	).Scan(&t.ID, &t.BarberID, &t.StartAt, &t.EndAt, &t.Reason)
	if err != nil {
		return models.BarberTimeOff{}, err
	}
	return t, nil
}

type TimeOffUpdateInput struct {
	ID       uuid.UUID
	BarberID uuid.UUID
	StartAt  time.Time
	EndAt    time.Time
	Reason   *string
}

func (s *TimeOffService) Update(ctx context.Context, in TimeOffUpdateInput) (models.BarberTimeOff, error) {
	if err := validatePeriod(in.StartAt, in.EndAt); err != nil {
		return models.BarberTimeOff{}, err
	}
	var t models.BarberTimeOff
	err := s.db.QueryRow(ctx,
		`UPDATE barber_time_off SET start_at=$1, end_at=$2, reason=$3 WHERE id=$4 AND barber_id=$5
         RETURNING id, barber_id, start_at, end_at, reason`,
		in.StartAt, in.EndAt, in.Reason, in.ID, in.BarberID,
	).Scan(&t.ID, &t.BarberID, &t.StartAt, &t.EndAt, &t.Reason)
	if err != nil {
		return models.BarberTimeOff{}, err
	}
	return t, nil
}

func (s *TimeOffService) Delete(ctx context.Context, barberID, id uuid.UUID) (models.BarberTimeOff, error) {
	var t models.BarberTimeOff
	err := s.db.QueryRow(ctx,
		`DELETE FROM barber_time_off WHERE id=$1 AND barber_id=$2
         RETURNING id, barber_id, start_at, end_at, reason`,
		id, barberID,
	).Scan(&t.ID, &t.BarberID, &t.StartAt, &t.EndAt, &t.Reason)
	if err != nil {
		return models.BarberTimeOff{}, err
	}
	return t, nil
}
