package handlers

import (
	"net/http"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PublicHandler struct {
	barbersSvc      *services.BarbersService
	barberServices  *services.BarberServicesService
	availabilitySvc *services.AvailabilityService
}

func NewPublicHandler(barbersSvc *services.BarbersService, barberServices *services.BarberServicesService, availability *services.AvailabilityService) *PublicHandler {
	return &PublicHandler{barbersSvc: barbersSvc, barberServices: barberServices, availabilitySvc: availability}
}

// List active barbers for a salon
func (h *PublicHandler) ListActiveBarbers(c *gin.Context) {
	salonID, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	list, err := h.barbersSvc.ListActiveBarbers(c.Request.Context(), salonID)
	if err != nil {
		ServerError(c, "list_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

// List active services for a barber
func (h *PublicHandler) ListActiveServices(c *gin.Context) {
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "invalid barber_id")
		return
	}
	list, err := h.barberServices.ListActive(c.Request.Context(), barberID)
	if err != nil {
		ServerError(c, "list_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

// Availability for a barber and service on a given date (YYYY-MM-DD or RFC3339 date)
func (h *PublicHandler) Availability(c *gin.Context) {
	barberID, err := uuid.Parse(c.Param("barber_id"))
	if err != nil {
		BadRequest(c, "invalid_barber_id", "invalid barber_id")
		return
	}
	serviceID, err := uuid.Parse(c.Param("service_id"))
	if err != nil {
		BadRequest(c, "invalid_service_id", "invalid service_id")
		return
	}
	dateStr := c.Query("date")
	if dateStr == "" {
		BadRequest(c, "missing_date", "date is required")
		return
	}
	// try parse YYYY-MM-DD then RFC3339
	var d time.Time
	if t, e := time.Parse("2006-01-02", dateStr); e == nil {
		d = t
	} else if t2, e2 := time.Parse(time.RFC3339, dateStr); e2 == nil {
		d = t2
	} else {
		BadRequest(c, "invalid_date", "date must be YYYY-MM-DD or RFC3339")
		return
	}
	slots, err := h.availabilitySvc.GetDailyAvailability(c.Request.Context(), services.AvailabilityInput{BarberID: barberID, ServiceID: serviceID, Date: d})
	if err != nil {
		ServerError(c, "availability_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, slots)
}
