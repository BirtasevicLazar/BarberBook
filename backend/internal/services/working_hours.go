package services

import (
	"context"
	"errors"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WorkingHoursService struct{ db *pgxpool.Pool }

func NewWorkingHoursService(db *pgxpool.Pool) *WorkingHoursService {
	return &WorkingHoursService{db: db}
}

type WorkingHourInput struct {
	BarberID  uuid.UUID
	DayOfWeek int
	StartTime time.Time
	EndTime   time.Time
}

func validateDayAndTimes(day int, start, end time.Time) error {
	if day < 0 || day > 6 {
		return errors.New("day_of_week must be between 0 and 6")
	}
	if !start.Before(end) {
		return errors.New("start_time must be before end_time")
	}
	return nil
}

func (s *WorkingHoursService) List(ctx context.Context, barberID uuid.UUID) ([]models.BarberWorkingHour, error) {
	rows, err := s.db.Query(ctx, `SELECT id, barber_id, day_of_week, start_time, end_time FROM barber_working_hours WHERE barber_id=$1 ORDER BY day_of_week, start_time`, barberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.BarberWorkingHour
	for rows.Next() {
		var wh models.BarberWorkingHour
		if err := rows.Scan(&wh.ID, &wh.BarberID, &wh.DayOfWeek, &wh.StartTime, &wh.EndTime); err != nil {
			return nil, err
		}
		out = append(out, wh)
	}
	return out, rows.Err()
}

func (s *WorkingHoursService) Create(ctx context.Context, in WorkingHourInput) (models.BarberWorkingHour, error) {
	if err := validateDayAndTimes(in.DayOfWeek, in.StartTime, in.EndTime); err != nil {
		return models.BarberWorkingHour{}, err
	}
	var wh models.BarberWorkingHour
	err := s.db.QueryRow(ctx,
		`INSERT INTO barber_working_hours (barber_id, day_of_week, start_time, end_time)
         VALUES ($1,$2,$3,$4)
         RETURNING id, barber_id, day_of_week, start_time, end_time`,
		in.BarberID, in.DayOfWeek, in.StartTime, in.EndTime,
	).Scan(&wh.ID, &wh.BarberID, &wh.DayOfWeek, &wh.StartTime, &wh.EndTime)
	if err != nil {
		return models.BarberWorkingHour{}, err
	}
	return wh, nil
}

type WorkingHourUpdateInput struct {
	ID        uuid.UUID
	BarberID  uuid.UUID
	DayOfWeek int
	StartTime time.Time
	EndTime   time.Time
}

func (s *WorkingHoursService) Update(ctx context.Context, in WorkingHourUpdateInput) (models.BarberWorkingHour, error) {
	if err := validateDayAndTimes(in.DayOfWeek, in.StartTime, in.EndTime); err != nil {
		return models.BarberWorkingHour{}, err
	}
	var wh models.BarberWorkingHour
	err := s.db.QueryRow(ctx,
		`UPDATE barber_working_hours SET day_of_week=$1, start_time=$2, end_time=$3 WHERE id=$4 AND barber_id=$5
         RETURNING id, barber_id, day_of_week, start_time, end_time`,
		in.DayOfWeek, in.StartTime, in.EndTime, in.ID, in.BarberID,
	).Scan(&wh.ID, &wh.BarberID, &wh.DayOfWeek, &wh.StartTime, &wh.EndTime)
	if err != nil {
		return models.BarberWorkingHour{}, err
	}
	return wh, nil
}

func (s *WorkingHoursService) Delete(ctx context.Context, barberID, id uuid.UUID) (models.BarberWorkingHour, error) {
	var wh models.BarberWorkingHour
	err := s.db.QueryRow(ctx,
		`DELETE FROM barber_working_hours WHERE id=$1 AND barber_id=$2
         RETURNING id, barber_id, day_of_week, start_time, end_time`,
		id, barberID,
	).Scan(&wh.ID, &wh.BarberID, &wh.DayOfWeek, &wh.StartTime, &wh.EndTime)
	if err != nil {
		return models.BarberWorkingHour{}, err
	}
	return wh, nil
}
