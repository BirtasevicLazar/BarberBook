package repositories

import (
	"context"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SalonsRepository struct {
	db *pgxpool.Pool
}

func NewSalonsRepository(db *pgxpool.Pool) *SalonsRepository {
	return &SalonsRepository{db: db}
}

func (r *SalonsRepository) GetByID(ctx context.Context, id uuid.UUID) (models.Salon, error) {
	var s models.Salon
	row := r.db.QueryRow(ctx, `SELECT id, name, phone, address, timezone, currency, owner_id, created_at FROM salons WHERE id=$1`, id)
	return scanSalon(row, &s)
}

func (r *SalonsRepository) Update(ctx context.Context, s models.Salon) (models.Salon, error) {
	row := r.db.QueryRow(ctx, `UPDATE salons SET name=$1, phone=$2, address=$3, timezone=$4, currency=$5 WHERE id=$6 RETURNING id, name, phone, address, timezone, currency, owner_id, created_at`, s.Name, s.Phone, s.Address, s.Timezone, s.Currency, s.ID)
	var out models.Salon
	return scanSalon(row, &out)
}

// GetByOwnerID returns the salon owned by the given user. Assumes one salon per owner.
func (r *SalonsRepository) GetByOwnerID(ctx context.Context, ownerID uuid.UUID) (models.Salon, error) {
	var s models.Salon
	row := r.db.QueryRow(ctx, `SELECT id, name, phone, address, timezone, currency, owner_id, created_at FROM salons WHERE owner_id=$1`, ownerID)
	return scanSalon(row, &s)
}

func scanSalon(row interface{ Scan(dest ...any) error }, s *models.Salon) (models.Salon, error) {
	if err := row.Scan(&s.ID, &s.Name, &s.Phone, &s.Address, &s.Timezone, &s.Currency, &s.OwnerID, &s.CreatedAt); err != nil {
		return models.Salon{}, err
	}
	return *s, nil
}
