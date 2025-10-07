package services

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AppointmentsService struct {
	db *pgxpool.Pool
}

func NewAppointmentsService(db *pgxpool.Pool) *AppointmentsService {
	return &AppointmentsService{db: db}
}

type PublicCreateAppointmentInput struct {
	SalonID         uuid.UUID
	BarberID        uuid.UUID
	BarberServiceID uuid.UUID
	CustomerName    string
	CustomerPhone   *string
	StartAt         time.Time
	Notes           *string
}

func (s *AppointmentsService) PublicCreate(ctx context.Context, in PublicCreateAppointmentInput) (models.Appointment, error) {
	if in.CustomerName == "" {
		return models.Appointment{}, errors.New("customer_name is required")
	}
	// price i duration_min izračunavamo iz izabrane usluge na DB strani
	var appt models.Appointment
	err := s.db.QueryRow(ctx,
		`INSERT INTO appointments (salon_id, barber_id, barber_service_id, customer_name, customer_phone, price, duration_min, start_at, status, notes)
         VALUES (
           $1,$2,$3,$4,$5,
           (SELECT price::float8 FROM barber_services WHERE id=$3 AND barber_id=$2),
           (SELECT duration_min FROM barber_services WHERE id=$3 AND barber_id=$2),
           $6, 'pending', $7)
         RETURNING id, salon_id, barber_id, barber_service_id, customer_name, customer_phone, price, duration_min, start_at, end_at, status, notes, created_at`,
		in.SalonID, in.BarberID, in.BarberServiceID, in.CustomerName, in.CustomerPhone, in.StartAt, in.Notes,
	).Scan(
		&appt.ID, &appt.SalonID, &appt.BarberID, &appt.BarberServiceID, &appt.CustomerName, &appt.CustomerPhone, &appt.Price, &appt.DurationMin, &appt.StartAt, &appt.EndAt, &appt.Status, &appt.Notes, &appt.CreatedAt,
	)
	if err != nil {
		// Unique/overlap or FK failures
		if pgErr, ok := err.(*pgconn.PgError); ok {
			// 23*** are integrity errors; "23P01" for exclusion? Generic mapping for now.
			return models.Appointment{}, pgErr
		}
		return models.Appointment{}, err
	}
	return appt, nil
}

type ListBarberAppointmentsInput struct {
	BarberID uuid.UUID
	From     *time.Time
	To       *time.Time
	Status   *string
}

func (s *AppointmentsService) ListForBarber(ctx context.Context, in ListBarberAppointmentsInput) ([]models.Appointment, error) {
	// Simple dynamic filter build
	query := `SELECT a.id, a.salon_id, a.barber_id, a.barber_service_id, bs.name as service_name, a.customer_name, a.customer_phone, a.price, a.duration_min, a.start_at, a.end_at, a.status, a.notes, a.created_at 
	          FROM appointments a 
	          LEFT JOIN barber_services bs ON a.barber_service_id = bs.id 
	          WHERE a.barber_id=$1`
	args := []any{in.BarberID}
	idx := 2
	if in.From != nil {
		query += " AND a.start_at >= $" + strconv.Itoa(idx)
		args = append(args, *in.From)
		idx++
	}
	if in.To != nil {
		query += " AND a.start_at <= $" + strconv.Itoa(idx)
		args = append(args, *in.To)
		idx++
	}
	if in.Status != nil {
		query += " AND a.status = $" + strconv.Itoa(idx)
		args = append(args, *in.Status)
		idx++
	}
	query += " ORDER BY a.start_at"
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Appointment
	for rows.Next() {
		var a models.Appointment
		if err := rows.Scan(&a.ID, &a.SalonID, &a.BarberID, &a.BarberServiceID, &a.ServiceName, &a.CustomerName, &a.CustomerPhone, &a.Price, &a.DurationMin, &a.StartAt, &a.EndAt, &a.Status, &a.Notes, &a.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// ConfirmByBarber: barber confirms a pending appointment
func (s *AppointmentsService) ConfirmByBarber(ctx context.Context, barberID, appointmentID uuid.UUID) (models.Appointment, error) {
	// First check if appointment exists and get its current status
	var currentStatus string
	var currentBarberID uuid.UUID
	checkErr := s.db.QueryRow(ctx,
		`SELECT status, barber_id FROM appointments WHERE id=$1`,
		appointmentID,
	).Scan(&currentStatus, &currentBarberID)

	if checkErr != nil {
		if checkErr == pgx.ErrNoRows {
			return models.Appointment{}, pgx.ErrNoRows // appointment doesn't exist
		}
		return models.Appointment{}, checkErr
	}

	// Check if appointment belongs to this barber
	if currentBarberID != barberID {
		return models.Appointment{}, pgx.ErrNoRows // not your appointment
	}

	// Check if already confirmed
	if currentStatus == "confirmed" {
		// If already confirmed, just return it (idempotent)
		var a models.Appointment
		err := s.db.QueryRow(ctx,
			`SELECT id, salon_id, barber_id, barber_service_id, customer_name, customer_phone, price, duration_min, start_at, end_at, status, notes, created_at
			 FROM appointments WHERE id=$1`,
			appointmentID,
		).Scan(&a.ID, &a.SalonID, &a.BarberID, &a.BarberServiceID, &a.CustomerName, &a.CustomerPhone, &a.Price, &a.DurationMin, &a.StartAt, &a.EndAt, &a.Status, &a.Notes, &a.CreatedAt)
		return a, err
	}

	// Check if status allows confirmation
	if currentStatus != "pending" {
		return models.Appointment{}, pgx.ErrNoRows // can only confirm pending appointments
	}

	// Now update to confirmed
	var a models.Appointment
	err := s.db.QueryRow(ctx,
		`UPDATE appointments SET status='confirmed' WHERE id=$1 AND barber_id=$2 AND status='pending'
         RETURNING id, salon_id, barber_id, barber_service_id, customer_name, customer_phone, price, duration_min, start_at, end_at, status, notes, created_at`,
		appointmentID, barberID,
	).Scan(&a.ID, &a.SalonID, &a.BarberID, &a.BarberServiceID, &a.CustomerName, &a.CustomerPhone, &a.Price, &a.DurationMin, &a.StartAt, &a.EndAt, &a.Status, &a.Notes, &a.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return models.Appointment{}, err
		}
		return models.Appointment{}, err
	}
	return a, nil
}

// CancelByBarber: only barber can cancel their own appointment
func (s *AppointmentsService) CancelByBarber(ctx context.Context, barberID, appointmentID uuid.UUID) (models.Appointment, error) {
	var a models.Appointment
	err := s.db.QueryRow(ctx,
		`UPDATE appointments SET status='canceled' WHERE id=$1 AND barber_id=$2 AND status <> 'canceled'
         RETURNING id, salon_id, barber_id, barber_service_id, customer_name, customer_phone, price, duration_min, start_at, end_at, status, notes, created_at`,
		appointmentID, barberID,
	).Scan(&a.ID, &a.SalonID, &a.BarberID, &a.BarberServiceID, &a.CustomerName, &a.CustomerPhone, &a.Price, &a.DurationMin, &a.StartAt, &a.EndAt, &a.Status, &a.Notes, &a.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return models.Appointment{}, err
		}
		return models.Appointment{}, err
	}
	return a, nil
}

// DeleteByBarber: only barber can delete their own appointment
func (s *AppointmentsService) DeleteByBarber(ctx context.Context, barberID, appointmentID uuid.UUID) error {
	result, err := s.db.Exec(ctx,
		`DELETE FROM appointments WHERE id=$1 AND barber_id=$2`,
		appointmentID, barberID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// no helper needed; using strconv.Itoa
