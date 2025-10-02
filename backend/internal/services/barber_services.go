package services

import (
	"context"
	"errors"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BarberServicesService struct {
	db *pgxpool.Pool
}

func NewBarberServicesService(db *pgxpool.Pool) *BarberServicesService {
	return &BarberServicesService{db: db}
}

type CreateServiceInput struct {
	BarberID    uuid.UUID
	Name        string
	Price       float64
	DurationMin int
}

func (s *BarberServicesService) List(ctx context.Context, barberID uuid.UUID) ([]models.BarberService, error) {
	rows, err := s.db.Query(ctx, `SELECT id, barber_id, name, price, duration_min, active, created_at FROM barber_services WHERE barber_id=$1 ORDER BY created_at`, barberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.BarberService
	for rows.Next() {
		var bs models.BarberService
		if err := rows.Scan(&bs.ID, &bs.BarberID, &bs.Name, &bs.Price, &bs.DurationMin, &bs.Active, &bs.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, bs)
	}
	return out, rows.Err()
}

// ListActive returns only active services for a barber (public view).
func (s *BarberServicesService) ListActive(ctx context.Context, barberID uuid.UUID) ([]models.BarberService, error) {
	rows, err := s.db.Query(ctx, `
		SELECT bs.id, bs.barber_id, bs.name, bs.price, bs.duration_min, bs.active, bs.created_at, sa.currency
		FROM barber_services bs
		JOIN barbers b ON b.id = bs.barber_id
		JOIN salons sa ON sa.id = b.salon_id
		WHERE bs.barber_id=$1 AND bs.active=true
		ORDER BY bs.name`, barberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.BarberService
	for rows.Next() {
		var bs models.BarberService
		if err := rows.Scan(&bs.ID, &bs.BarberID, &bs.Name, &bs.Price, &bs.DurationMin, &bs.Active, &bs.CreatedAt, &bs.Currency); err != nil {
			return nil, err
		}
		out = append(out, bs)
	}
	return out, rows.Err()
}

func (s *BarberServicesService) Get(ctx context.Context, barberID, serviceID uuid.UUID) (models.BarberService, error) {
	var bs models.BarberService
	err := s.db.QueryRow(ctx, `SELECT id, barber_id, name, price, duration_min, active, created_at FROM barber_services WHERE id=$1 AND barber_id=$2`, serviceID, barberID).
		Scan(&bs.ID, &bs.BarberID, &bs.Name, &bs.Price, &bs.DurationMin, &bs.Active, &bs.CreatedAt)
	if err != nil {
		return models.BarberService{}, err
	}
	return bs, nil
}

func (s *BarberServicesService) Create(ctx context.Context, in CreateServiceInput) (models.BarberService, error) {
	if in.Name == "" {
		return models.BarberService{}, errors.New("name is required")
	}
	if in.Price < 0 {
		return models.BarberService{}, errors.New("price must be >= 0")
	}
	if in.DurationMin <= 0 {
		return models.BarberService{}, errors.New("duration_min must be > 0")
	}
	var bs models.BarberService
	err := s.db.QueryRow(ctx,
		`INSERT INTO barber_services (barber_id, name, price, duration_min) VALUES ($1,$2,$3,$4)
         RETURNING id, barber_id, name, price, duration_min, active, created_at`,
		in.BarberID, in.Name, in.Price, in.DurationMin,
	).Scan(&bs.ID, &bs.BarberID, &bs.Name, &bs.Price, &bs.DurationMin, &bs.Active, &bs.CreatedAt)
	if err != nil {
		return models.BarberService{}, err
	}
	return bs, nil
}

type UpdateServiceInput struct {
	BarberID    uuid.UUID
	ServiceID   uuid.UUID
	Name        string
	Price       float64
	DurationMin int
	Active      bool
}

func (s *BarberServicesService) Update(ctx context.Context, in UpdateServiceInput) (models.BarberService, error) {
	if in.Name == "" {
		return models.BarberService{}, errors.New("name is required")
	}
	if in.Price < 0 {
		return models.BarberService{}, errors.New("price must be >= 0")
	}
	if in.DurationMin <= 0 {
		return models.BarberService{}, errors.New("duration_min must be > 0")
	}
	var bs models.BarberService
	err := s.db.QueryRow(ctx,
		`UPDATE barber_services SET name=$1, price=$2, duration_min=$3, active=$4 WHERE id=$5 AND barber_id=$6
         RETURNING id, barber_id, name, price, duration_min, active, created_at`,
		in.Name, in.Price, in.DurationMin, in.Active, in.ServiceID, in.BarberID,
	).Scan(&bs.ID, &bs.BarberID, &bs.Name, &bs.Price, &bs.DurationMin, &bs.Active, &bs.CreatedAt)
	if err != nil {
		return models.BarberService{}, err
	}
	return bs, nil
}

func (s *BarberServicesService) Deactivate(ctx context.Context, barberID, serviceID uuid.UUID) (models.BarberService, error) {
	var bs models.BarberService
	err := s.db.QueryRow(ctx,
		`UPDATE barber_services SET active=false WHERE id=$1 AND barber_id=$2
         RETURNING id, barber_id, name, price, duration_min, active, created_at`,
		serviceID, barberID,
	).Scan(&bs.ID, &bs.BarberID, &bs.Name, &bs.Price, &bs.DurationMin, &bs.Active, &bs.CreatedAt)
	if err != nil {
		return models.BarberService{}, err
	}
	return bs, nil
}
