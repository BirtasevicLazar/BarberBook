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
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	var req addBarberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", err.Error())
		return
	}

	// owner check: ensure token.sub == salon.owner_id
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "salon not found")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "authorization required")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "you are not allowed to add barbers to this salon")
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
				Conflict(c, "duplicate_email", "email already exists")
				return
			case "barbers_salon_id_display_name_key":
				Conflict(c, "duplicate_display_name", "display name already exists for this salon")
				return
			default:
				Conflict(c, "duplicate", "unique constraint violated")
				return
			}
		}
		ServerError(c, "create_barber_failed", err.Error())
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
		Unauthorized(c, "missing_token", "authorization required")
		return
	}
	uidStr, ok := uidVal.(string)
	if !ok {
		Unauthorized(c, "invalid_token", "invalid token")
		return
	}
	userID, err := uuid.Parse(uidStr)
	if err != nil {
		BadRequest(c, "invalid_user_id", "invalid user id in token")
		return
	}
	b, err := h.svc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "barber profile not found")
			return
		}
		ServerError(c, "fetch_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, b)
}

func (h *BarbersHandler) ListBarbers(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "salon not found")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "authorization required")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "not allowed")
		return
	}
	list, err := h.svc.ListBarbers(c.Request.Context(), salonID)
	if err != nil {
		ServerError(c, "list_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *BarbersHandler) GetBarber(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "invalid barber_id")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "salon not found")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "authorization required")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "not allowed")
		return
	}
	b, err := h.svc.GetBarber(c.Request.Context(), salonID, barberID)
	if err != nil {
		NotFound(c, "barber_not_found", "barber not found")
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
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "invalid barber_id")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "salon not found")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "authorization required")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "not allowed")
		return
	}
	var req updateBarberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", err.Error())
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
		ServerError(c, "update_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, b)
}

func (h *BarbersHandler) DeactivateBarber(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "invalid barber_id")
		return
	}
	s, err := h.salonsRepo.GetByID(c.Request.Context(), salonID)
	if err != nil {
		NotFound(c, "salon_not_found", "salon not found")
		return
	}
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "authorization required")
		return
	}
	uid, ok := uidVal.(string)
	if !ok || s.OwnerID.String() != uid {
		Unauthorized(c, "forbidden", "not allowed")
		return
	}
	b, err := h.svc.DeactivateBarber(c.Request.Context(), salonID, barberID)
	if err != nil {
		ServerError(c, "deactivate_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, b)
}
