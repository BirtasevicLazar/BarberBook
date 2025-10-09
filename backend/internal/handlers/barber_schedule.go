package handlers

import (
	"net/http"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type BarberScheduleHandler struct {
	barbersSvc *services.BarbersService
	hoursSvc   *services.WorkingHoursService
	breaksSvc  *services.BreaksService
}

func NewBarberScheduleHandler(barbersSvc *services.BarbersService, hoursSvc *services.WorkingHoursService, breaksSvc *services.BreaksService) *BarberScheduleHandler {
	return &BarberScheduleHandler{barbersSvc: barbersSvc, hoursSvc: hoursSvc, breaksSvc: breaksSvc}
}

func (h *BarberScheduleHandler) getAuthBarberID(c *gin.Context) (uuid.UUID, bool) {
	uidVal, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return uuid.Nil, false
	}
	uidStr, ok := uidVal.(string)
	if !ok {
		Unauthorized(c, "invalid_token", "Nevažeći token")
		return uuid.Nil, false
	}
	userID, err := uuid.Parse(uidStr)
	if err != nil {
		Unauthorized(c, "invalid_token", "Nevažeći token")
		return uuid.Nil, false
	}
	b, err := h.barbersSvc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "Profil frizera nije pronađen")
			return uuid.Nil, false
		}
		ServerError(c, "barber_lookup_failed", "Greška pri učitavanju profila frizera")
		return uuid.Nil, false
	}
	return b.ID, true
}

// -------- Working hours --------
func (h *BarberScheduleHandler) ListHours(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	items, err := h.hoursSvc.List(c.Request.Context(), barberID)
	if err != nil {
		ServerError(c, "list_failed", "Greška pri učitavanju radnog vremena")
		return
	}
	c.JSON(http.StatusOK, items)
}

type upsertHourBody struct {
	DayOfWeek int       `json:"day_of_week" binding:"required,min=0,max=6"`
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time" binding:"required"`
}

func (h *BarberScheduleHandler) CreateHour(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	var body upsertHourBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	item, err := h.hoursSvc.Create(c.Request.Context(), services.WorkingHourInput{BarberID: barberID, DayOfWeek: body.DayOfWeek, StartTime: body.StartTime, EndTime: body.EndTime})
	if err != nil {
		BadRequest(c, "create_failed", "Greška pri kreiranju radnog vremena")
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *BarberScheduleHandler) UpdateHour(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	id, err := uuid.Parse(c.Param("hour_id"))
	if err != nil {
		BadRequest(c, "invalid_hour_id", "Nepravilan ID radnog vremena")
		return
	}
	var body upsertHourBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	item, err := h.hoursSvc.Update(c.Request.Context(), services.WorkingHourUpdateInput{ID: id, BarberID: barberID, DayOfWeek: body.DayOfWeek, StartTime: body.StartTime, EndTime: body.EndTime})
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "hour_not_found", "Radno vreme nije pronađeno")
			return
		}
		BadRequest(c, "update_failed", "Greška pri ažuriranju radnog vremena")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *BarberScheduleHandler) DeleteHour(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	id, err := uuid.Parse(c.Param("hour_id"))
	if err != nil {
		BadRequest(c, "invalid_hour_id", "Nepravilan ID radnog vremena")
		return
	}
	item, err := h.hoursSvc.Delete(c.Request.Context(), barberID, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "hour_not_found", "Radno vreme nije pronađeno")
			return
		}
		ServerError(c, "delete_failed", "Greška pri brisanju radnog vremena")
		return
	}
	c.JSON(http.StatusOK, item)
}

// -------- Breaks --------
func (h *BarberScheduleHandler) ListBreaks(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	items, err := h.breaksSvc.List(c.Request.Context(), barberID)
	if err != nil {
		ServerError(c, "list_failed", "Greška pri učitavanju pauza")
		return
	}
	c.JSON(http.StatusOK, items)
}

type upsertBreakBody struct {
	DayOfWeek int       `json:"day_of_week" binding:"required,min=0,max=6"`
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time" binding:"required"`
}

func (h *BarberScheduleHandler) CreateBreak(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	var body upsertBreakBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	item, err := h.breaksSvc.Create(c.Request.Context(), services.BreakInput{BarberID: barberID, DayOfWeek: body.DayOfWeek, StartTime: body.StartTime, EndTime: body.EndTime})
	if err != nil {
		BadRequest(c, "create_failed", "Greška pri kreiranju pauze")
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *BarberScheduleHandler) UpdateBreak(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	id, err := uuid.Parse(c.Param("break_id"))
	if err != nil {
		BadRequest(c, "invalid_break_id", "Nepravilan ID pauze")
		return
	}
	var body upsertBreakBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	item, err := h.breaksSvc.Update(c.Request.Context(), services.BreakUpdateInput{ID: id, BarberID: barberID, DayOfWeek: body.DayOfWeek, StartTime: body.StartTime, EndTime: body.EndTime})
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "break_not_found", "Pauza nije pronađena")
			return
		}
		BadRequest(c, "update_failed", "Greška pri ažuriranju pauze")
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *BarberScheduleHandler) DeleteBreak(c *gin.Context) {
	barberID, ok := h.getAuthBarberID(c)
	if !ok {
		return
	}
	id, err := uuid.Parse(c.Param("break_id"))
	if err != nil {
		BadRequest(c, "invalid_break_id", "Nepravilan ID pauze")
		return
	}
	item, err := h.breaksSvc.Delete(c.Request.Context(), barberID, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "break_not_found", "Pauza nije pronađena")
			return
		}
		ServerError(c, "delete_failed", "Greška pri brisanju pauze")
		return
	}
	c.JSON(http.StatusOK, item)
}
