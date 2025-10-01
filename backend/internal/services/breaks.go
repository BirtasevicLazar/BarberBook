package services

import (
	"context"
	"errors"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BreaksService struct{ db *pgxpool.Pool }

func NewBreaksService(db *pgxpool.Pool) *BreaksService { return &BreaksService{db: db} }

type BreakInput struct {
	BarberID  uuid.UUID
	DayOfWeek int
	StartTime time.Time
	EndTime   time.Time
}

func validateBreak(day int, start, end time.Time) error {
	if day < 0 || day > 6 {
		return errors.New("day_of_week must be between 0 and 6")
	}
	if !start.Before(end) {
		return errors.New("start_time must be before end_time")
	}
	return nil
}

func (s *BreaksService) List(ctx context.Context, barberID uuid.UUID) ([]models.BarberBreak, error) {
	rows, err := s.db.Query(ctx, `SELECT id, barber_id, day_of_week, start_time, end_time FROM barber_breaks WHERE barber_id=$1 ORDER BY day_of_week, start_time`, barberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.BarberBreak
	for rows.Next() {
		var b models.BarberBreak
		if err := rows.Scan(&b.ID, &b.BarberID, &b.DayOfWeek, &b.StartTime, &b.EndTime); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (s *BreaksService) Create(ctx context.Context, in BreakInput) (models.BarberBreak, error) {
	if err := validateBreak(in.DayOfWeek, in.StartTime, in.EndTime); err != nil {
		return models.BarberBreak{}, err
	}
	var b models.BarberBreak
	err := s.db.QueryRow(ctx,
		`INSERT INTO barber_breaks (barber_id, day_of_week, start_time, end_time)
         VALUES ($1,$2,$3,$4)
         RETURNING id, barber_id, day_of_week, start_time, end_time`,
		in.BarberID, in.DayOfWeek, in.StartTime, in.EndTime,
	).Scan(&b.ID, &b.BarberID, &b.DayOfWeek, &b.StartTime, &b.EndTime)
	if err != nil {
		return models.BarberBreak{}, err
	}
	return b, nil
}

type BreakUpdateInput struct {
	ID        uuid.UUID
	BarberID  uuid.UUID
	DayOfWeek int
	StartTime time.Time
	EndTime   time.Time
}

func (s *BreaksService) Update(ctx context.Context, in BreakUpdateInput) (models.BarberBreak, error) {
	if err := validateBreak(in.DayOfWeek, in.StartTime, in.EndTime); err != nil {
		return models.BarberBreak{}, err
	}
	var b models.BarberBreak
	err := s.db.QueryRow(ctx,
		`UPDATE barber_breaks SET day_of_week=$1, start_time=$2, end_time=$3 WHERE id=$4 AND barber_id=$5
         RETURNING id, barber_id, day_of_week, start_time, end_time`,
		in.DayOfWeek, in.StartTime, in.EndTime, in.ID, in.BarberID,
	).Scan(&b.ID, &b.BarberID, &b.DayOfWeek, &b.StartTime, &b.EndTime)
	if err != nil {
		return models.BarberBreak{}, err
	}
	return b, nil
}

func (s *BreaksService) Delete(ctx context.Context, barberID, id uuid.UUID) (models.BarberBreak, error) {
	var b models.BarberBreak
	err := s.db.QueryRow(ctx,
		`DELETE FROM barber_breaks WHERE id=$1 AND barber_id=$2
         RETURNING id, barber_id, day_of_week, start_time, end_time`,
		id, barberID,
	).Scan(&b.ID, &b.BarberID, &b.DayOfWeek, &b.StartTime, &b.EndTime)
	if err != nil {
		return models.BarberBreak{}, err
	}
	return b, nil
}
