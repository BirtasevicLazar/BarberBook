package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	Phone        *string   `json:"phone,omitempty"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Salon struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Address   string    `json:"address"`
	Timezone  string    `json:"timezone"`
	Currency  string    `json:"currency"`
	OwnerID   uuid.UUID `json:"owner_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Barber struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"user_id"`
	SalonID             uuid.UUID `json:"salon_id"`
	DisplayName         string    `json:"display_name"`
	Active              bool      `json:"active"`
	SlotDurationMinutes int       `json:"slot_duration_minutes"`
	CreatedAt           time.Time `json:"created_at"`
}

type BarberService struct {
	ID          uuid.UUID `json:"id"`
	BarberID    uuid.UUID `json:"barber_id"`
	Name        string    `json:"name"`
	Price       float64   `json:"price"`
	DurationMin int       `json:"duration_min"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
}

type BarberWorkingHour struct {
	ID        uuid.UUID `json:"id"`
	BarberID  uuid.UUID `json:"barber_id"`
	DayOfWeek int       `json:"day_of_week"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type BarberBreak struct {
	ID        uuid.UUID `json:"id"`
	BarberID  uuid.UUID `json:"barber_id"`
	DayOfWeek int       `json:"day_of_week"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type Appointment struct {
	ID              uuid.UUID `json:"id"`
	SalonID         uuid.UUID `json:"salon_id"`
	BarberID        uuid.UUID `json:"barber_id"`
	BarberServiceID uuid.UUID `json:"barber_service_id"`
	CustomerName    string    `json:"customer_name"`
	CustomerPhone   *string   `json:"customer_phone,omitempty"`
	Price           float64   `json:"price"`
	DurationMin     int       `json:"duration_min"`
	StartAt         time.Time `json:"start_at"`
	EndAt           time.Time `json:"end_at"`
	Status          string    `json:"status"`
	Notes           *string   `json:"notes,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

type BarberTimeOff struct {
	ID       uuid.UUID `json:"id"`
	BarberID uuid.UUID `json:"barber_id"`
	StartAt  time.Time `json:"start_at"`
	EndAt    time.Time `json:"end_at"`
	Reason   *string   `json:"reason,omitempty"`
}
