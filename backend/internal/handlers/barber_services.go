package handlers

import (
	"net/http"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type BarberServicesHandler struct {
	svc        *services.BarberServicesService
	barbersSvc *services.BarbersService
}

func NewBarberServicesHandler(svc *services.BarberServicesService, barbersSvc *services.BarbersService) *BarberServicesHandler {
	return &BarberServicesHandler{svc: svc, barbersSvc: barbersSvc}
}

func (h *BarberServicesHandler) getAuthBarberID(c *gin.Context) (uuid.UUID, bool) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "authorization required")
		return uuid.Nil, false
	}
	uidStr, ok := uidVal.(string)
	if !ok {
		Unauthorized(c, "invalid_token", "invalid token")
		return uuid.Nil, false
	}
	userID, err := uuid.Parse(uidStr)
	if err != nil {
		Unauthorized(c, "invalid_token", "invalid token")
		return uuid.Nil, false
	}
	b, err := h.barbersSvc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "barber profile not found")
			return uuid.Nil, false
		}
		ServerError(c, "barber_lookup_failed", err.Error())
		return uuid.Nil, false
	}
	return b.ID, true
}

// List services for the authenticated barber
func (h *BarberServicesHandler) List(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	items, err := h.svc.List(c.Request.Context(), barberID)
	if err != nil {
		ServerError(c, "list_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, items)
}

type createServiceRequest struct {
	Name        string  `json:"name" binding:"required"`
	Price       float64 `json:"price" binding:"required"`
	DurationMin int     `json:"duration_min" binding:"required,min=1"`
}

func (h *BarberServicesHandler) Create(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	var req createServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", err.Error())
		return
	}
	bs, err := h.svc.Create(c.Request.Context(), services.CreateServiceInput{
		BarberID:    barberID,
		Name:        req.Name,
		Price:       req.Price,
		DurationMin: req.DurationMin,
	})
	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			// UNIQUE (barber_id, name)
			Conflict(c, "duplicate_service", "service with that name already exists")
			return
		}
		ServerError(c, "create_failed", err.Error())
		return
	}
	c.JSON(http.StatusCreated, bs)
}

type updateServiceRequest struct {
	Name        string  `json:"name" binding:"required"`
	Price       float64 `json:"price" binding:"required"`
	DurationMin int     `json:"duration_min" binding:"required,min=1"`
	Active      bool    `json:"active"`
}

func (h *BarberServicesHandler) Update(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	sid, err := uuid.Parse(c.Param("service_id"))
	if err != nil {
		BadRequest(c, "invalid_service_id", "invalid service_id")
		return
	}
	var req updateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", err.Error())
		return
	}
	bs, err := h.svc.Update(c.Request.Context(), services.UpdateServiceInput{
		BarberID:    barberID,
		ServiceID:   sid,
		Name:        req.Name,
		Price:       req.Price,
		DurationMin: req.DurationMin,
		Active:      req.Active,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "service_not_found", "service not found")
			return
		}
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			Conflict(c, "duplicate_service", "service with that name already exists")
			return
		}
		ServerError(c, "update_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, bs)
}

func (h *BarberServicesHandler) Deactivate(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	sid, err := uuid.Parse(c.Param("service_id"))
	if err != nil {
		BadRequest(c, "invalid_service_id", "invalid service_id")
		return
	}
	bs, err := h.svc.Deactivate(c.Request.Context(), barberID, sid)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "service_not_found", "service not found")
			return
		}
		ServerError(c, "deactivate_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, bs)
}
