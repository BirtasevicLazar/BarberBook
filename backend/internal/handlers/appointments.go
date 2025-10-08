package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type AppointmentsHandler struct {
	svc        *services.AppointmentsService
	barbersSvc *services.BarbersService
	emailSvc   *services.EmailService
}

func NewAppointmentsHandler(svc *services.AppointmentsService, barbersSvc *services.BarbersService, emailSvc *services.EmailService) *AppointmentsHandler {
	return &AppointmentsHandler{svc: svc, barbersSvc: barbersSvc, emailSvc: emailSvc}
}

// PublicCreate allows customers to create an appointment; only booking allowed.
type publicCreateBody struct {
	SalonID         string    `json:"salon_id" binding:"required"`
	BarberID        string    `json:"barber_id" binding:"required"`
	BarberServiceID string    `json:"barber_service_id" binding:"required"`
	CustomerName    string    `json:"customer_name" binding:"required"`
	CustomerPhone   *string   `json:"customer_phone"`
	CustomerEmail   *string   `json:"customer_email"`
	StartAt         time.Time `json:"start_at" binding:"required"`
	Notes           *string   `json:"notes"`
}

func (h *AppointmentsHandler) PublicCreate(c *gin.Context) {
	var body publicCreateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		BadRequest(c, "invalid_body", err.Error())
		return
	}
	salonID, err := uuid.Parse(body.SalonID)
	if err != nil {
		BadRequest(c, "invalid_salon_id", "invalid salon_id")
		return
	}
	barberID, err := uuid.Parse(body.BarberID)
	if err != nil {
		BadRequest(c, "invalid_barber_id", "invalid barber_id")
		return
	}
	serviceID, err := uuid.Parse(body.BarberServiceID)
	if err != nil {
		BadRequest(c, "invalid_service_id", "invalid barber_service_id")
		return
	}
	appt, err := h.svc.PublicCreate(c.Request.Context(), services.PublicCreateAppointmentInput{
		SalonID:         salonID,
		BarberID:        barberID,
		BarberServiceID: serviceID,
		CustomerName:    body.CustomerName,
		CustomerPhone:   body.CustomerPhone,
		CustomerEmail:   body.CustomerEmail,
		StartAt:         body.StartAt,
		Notes:           body.Notes,
	})
	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok {
			// Map relevant integrity errors to 400
			BadRequest(c, "booking_failed", pgErr.Message)
			return
		}
		ServerError(c, "booking_failed", err.Error())
		return
	}
	c.JSON(http.StatusCreated, appt)
}

// Barber-only: list appointments
func (h *AppointmentsHandler) ListForBarber(c *gin.Context) {
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
		Unauthorized(c, "invalid_token", "invalid token")
		return
	}
	b, err := h.barbersSvc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "barber profile not found")
			return
		}
		ServerError(c, "barber_lookup_failed", err.Error())
		return
	}

	var fromPtr, toPtr *time.Time
	var statusPtr *string
	if v := c.Query("from"); v != "" {
		t, e := time.Parse(time.RFC3339, v)
		if e == nil {
			fromPtr = &t
		}
	}
	if v := c.Query("to"); v != "" {
		t, e := time.Parse(time.RFC3339, v)
		if e == nil {
			toPtr = &t
		}
	}
	if v := c.Query("status"); v != "" {
		statusPtr = &v
	}

	items, err := h.svc.ListForBarber(c.Request.Context(), services.ListBarberAppointmentsInput{BarberID: b.ID, From: fromPtr, To: toPtr, Status: statusPtr})
	if err != nil {
		ServerError(c, "list_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, items)
}

// Barber-only: confirm appointment
func (h *AppointmentsHandler) ConfirmByBarber(c *gin.Context) {
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
		Unauthorized(c, "invalid_token", "invalid token")
		return
	}
	b, err := h.barbersSvc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "barber profile not found")
			return
		}
		ServerError(c, "barber_lookup_failed", err.Error())
		return
	}

	apptID, err := uuid.Parse(c.Param("appointment_id"))
	if err != nil {
		BadRequest(c, "invalid_appointment_id", "invalid appointment_id")
		return
	}
	c.Writer.Header().Set("X-Debug-Barber-ID", b.ID.String())
	c.Writer.Header().Set("X-Debug-Appointment-ID", apptID.String())
	a, err := h.svc.ConfirmByBarber(c.Request.Context(), b.ID, apptID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "appointment_not_found", "appointment not found, not yours, or not pending")
			return
		}
		ServerError(c, "confirm_failed", err.Error())
		return
	}

	// Send confirmation email if customer email is provided
	if a.CustomerEmail != nil && *a.CustomerEmail != "" {
		log.Printf("📧 Customer email found: %s - preparing to send confirmation", *a.CustomerEmail)

		// Get full appointment details (salon name, barber name, service name)
		details, err := h.svc.GetAppointmentDetails(c.Request.Context(), apptID)
		if err != nil {
			log.Printf("❌ Failed to get appointment details for email: %v", err)
			c.Writer.Header().Set("X-Email-Error", "failed to fetch appointment details")
		} else {
			log.Printf("✅ Appointment details retrieved: salon=%s, barber=%s, service=%s",
				details.SalonName, details.BarberName, details.ServiceName)

			// Send email asynchronously to avoid blocking the response
			go func() {
				log.Printf("🚀 Starting async email send to: %s", *a.CustomerEmail)
				emailErr := h.emailSvc.SendAppointmentConfirmation(
					*a.CustomerEmail,
					a.CustomerName,
					details.ServiceName,
					a.StartAt,
					a.DurationMin,
					details.BarberName,
					details.SalonName,
				)
				if emailErr != nil {
					log.Printf("❌ Email send failed: %v", emailErr)
				} else {
					log.Printf("✅ Email sent successfully to: %s", *a.CustomerEmail)
				}
			}()
		}
	} else {
		log.Printf("⚠️  No customer email provided - skipping email notification")
	}

	c.JSON(http.StatusOK, a)
}

// Barber-only: cancel appointment
func (h *AppointmentsHandler) CancelByBarber(c *gin.Context) {
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
		Unauthorized(c, "invalid_token", "invalid token")
		return
	}
	b, err := h.barbersSvc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "barber profile not found")
			return
		}
		ServerError(c, "barber_lookup_failed", err.Error())
		return
	}

	apptID, err := uuid.Parse(c.Param("appointment_id"))
	if err != nil {
		BadRequest(c, "invalid_appointment_id", "invalid appointment_id")
		return
	}
	a, err := h.svc.CancelByBarber(c.Request.Context(), b.ID, apptID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "appointment_not_found", "appointment not found or already canceled")
			return
		}
		ServerError(c, "cancel_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, a)
}

// Barber-only: delete appointment
func (h *AppointmentsHandler) DeleteByBarber(c *gin.Context) {
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
		Unauthorized(c, "invalid_token", "invalid token")
		return
	}
	b, err := h.barbersSvc.GetBarberByUser(c.Request.Context(), userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "barber_not_found", "barber profile not found")
			return
		}
		ServerError(c, "barber_lookup_failed", err.Error())
		return
	}

	apptID, err := uuid.Parse(c.Param("appointment_id"))
	if err != nil {
		BadRequest(c, "invalid_appointment_id", "invalid appointment_id")
		return
	}

	err = h.svc.DeleteByBarber(c.Request.Context(), b.ID, apptID)
	if err != nil {
		if err == pgx.ErrNoRows {
			NotFound(c, "appointment_not_found", "appointment not found")
			return
		}
		ServerError(c, "delete_failed", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "appointment deleted"})
}
