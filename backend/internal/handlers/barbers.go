package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/repositories"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
)

type BarbersHandler struct {
	svc        *services.BarbersService
	salonsRepo *repositories.SalonsRepository
}

func NewBarbersHandler(svc *services.BarbersService, salonsRepo *repositories.SalonsRepository) *BarbersHandler {
	return &BarbersHandler{svc: svc, salonsRepo: salonsRepo}
}

type addBarberRequest struct {
	Email               string  `json:"email" binding:"required,email"`
	Password            string  `json:"password" binding:"required,min=6"`
	FullName            string  `json:"full_name" binding:"required"`
	Phone               *string `json:"phone"`
	DisplayName         string  `json:"display_name" binding:"required"`
	SlotDurationMinutes int     `json:"slot_duration_minutes" binding:"required,min=1"`
}

func (h *BarbersHandler) CreateBarber(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	var req addBarberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}

	// owner check: ensure token.sub == salon.owner_id
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "Nemate dozvolu da dodajete frizere u ovaj salon")
		return
	}

	res, err := h.svc.AddBarber(c.Request.Context(), services.AddBarberInput{
		SalonID:             salonID,
		Email:               req.Email,
		Password:            req.Password,
		FullName:            req.FullName,
		Phone:               req.Phone,
		DisplayName:         req.DisplayName,
		SlotDurationMinutes: req.SlotDurationMinutes,
	})
	if err != nil {
		// Map unique violations to 409 Conflict (users.email or barbers (salon_id, display_name))
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			// Try to tailor the message based on constraint name
			switch pgErr.ConstraintName {
			case "users_email_key":
				Conflict(c, "duplicate_email", "Korisnik sa ovim emailom već postoji")
				return
			case "barbers_salon_id_display_name_key":
				Conflict(c, "duplicate_display_name", "Frizer sa ovim imenom već postoji u ovom salonu")
				return
			default:
				Conflict(c, "duplicate", "Ovaj unos već postoji")
				return
			}
		}
		ServerError(c, "create_barber_failed", "Greška pri kreiranju frizera")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user_id": res.UserID,
		"barber":  res.Barber,
	})
}

// Me returns the authenticated barber's profile (role=barber required)
func (h *BarbersHandler) Me(c *gin.Context) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uidStr, ok := uidVal.(string)
	if !ok {
		Unauthorized(c, "invalid_token", "Nevažeći token")
		return
	}
	userID, err := uuid.Parse(uidStr)
	if err != nil {
		BadRequest(c, "invalid_user_id", "Nevažeći ID korisnika")
		return
	}
	b, err := h.svc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "Profil frizera nije pronađen")
			return
		}
		ServerError(c, "fetch_failed", "Greška pri učitavanju podataka")
		return
	}
	c.JSON(http.StatusOK, b)
}

func (h *BarbersHandler) ListBarbers(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "Nemate pristup ovom resursu")
		return
	}
	list, err := h.svc.ListBarbers(c.Request.Context(), salonID)
	if err != nil {
		ServerError(c, "list_failed", "Greška pri učitavanju liste frizera")
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *BarbersHandler) GetBarber(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "Nepravilan ID frizera")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "Nemate pristup ovom resursu")
		return
	}
	b, err := h.svc.GetBarber(c.Request.Context(), salonID, barberID)
	if err != nil {
		NotFound(c, "barber_not_found", "Frizer nije pronađen")
		return
	}
	c.JSON(http.StatusOK, b)
}

type updateBarberRequest struct {
	DisplayName         string `json:"display_name" binding:"required"`
	Active              bool   `json:"active"`
	SlotDurationMinutes int    `json:"slot_duration_minutes" binding:"required,min=1"`
}

func (h *BarbersHandler) UpdateBarber(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "Nepravilan ID frizera")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "Nemate pristup ovom resursu")
		return
	}
	var req updateBarberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	b, err := h.svc.UpdateBarber(c.Request.Context(), services.UpdateBarberInput{
		SalonID:             salonID,
		BarberID:            barberID,
		DisplayName:         req.DisplayName,
		Active:              req.Active,
		SlotDurationMinutes: req.SlotDurationMinutes,
	})
	if err != nil {
		ServerError(c, "update_failed", "Greška pri ažuriranju podataka o frizeru")
		return
	}
	c.JSON(http.StatusOK, b)
}

func (h *BarbersHandler) DeactivateBarber(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "Nepravilan ID frizera")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "Nemate pristup ovom resursu")
		return
	}
	b, err := h.svc.DeactivateBarber(c.Request.Context(), salonID, barberID)
	if err != nil {
		ServerError(c, "deactivate_failed", "Greška pri deaktivaciji frizera")
		return
	}
	c.JSON(http.StatusOK, b)
}
