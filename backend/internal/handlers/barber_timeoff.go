package handlers

import (
	"net/http"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type BarberTimeOffHandler struct {
	barbersSvc *services.BarbersService
	timeOffSvc *services.TimeOffService
}

func NewBarberTimeOffHandler(barbersSvc *services.BarbersService, timeOffSvc *services.TimeOffService) *BarberTimeOffHandler {
	return &BarberTimeOffHandler{barbersSvc: barbersSvc, timeOffSvc: timeOffSvc}
}

func (h *BarberTimeOffHandler) getAuthBarberID(c *gin.Context) (uuid.UUID, bool) {
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

func (h *BarberTimeOffHandler) List(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	items, err := h.timeOffSvc.List(c.Request.Context(), barberID)
	if err != nil {
		ServerError(c, "list_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, items)
}

type upsertTimeOffBody struct {
	StartAt time.Time `json:"start_at" binding:"required"`
	EndAt   time.Time `json:"end_at" binding:"required"`
	Reason  *string   `json:"reason"`
}

func (h *BarberTimeOffHandler) Create(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	var body upsertTimeOffBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", err.Error())
		return
	}
	item, err := h.timeOffSvc.Create(c.Request.Context(), services.TimeOffInput{BarberID: barberID, StartAt: body.StartAt, EndAt: body.EndAt, Reason: body.Reason})
	if err != nil {
		BadRequest(c, "create_failed", err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *BarberTimeOffHandler) Update(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	id, err := uuid.Parse(c.Param("timeoff_id"))
	if err != nil {
		BadRequest(c, "invalid_timeoff_id", "invalid timeoff_id")
		return
	}
	var body upsertTimeOffBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", err.Error())
		return
	}
	item, err := h.timeOffSvc.Update(c.Request.Context(), services.TimeOffUpdateInput{ID: id, BarberID: barberID, StartAt: body.StartAt, EndAt: body.EndAt, Reason: body.Reason})
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "timeoff_not_found", "time off not found")
			return
		}
		BadRequest(c, "update_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *BarberTimeOffHandler) Delete(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	id, err := uuid.Parse(c.Param("timeoff_id"))
	if err != nil {
		BadRequest(c, "invalid_timeoff_id", "invalid timeoff_id")
		return
	}
	item, err := h.timeOffSvc.Delete(c.Request.Context(), barberID, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "timeoff_not_found", "time off not found")
			return
		}
		ServerError(c, "delete_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}
