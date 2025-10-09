package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/models"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/repositories"
)

type SalonsReadWriteHandler struct {
	repo *repositories.SalonsRepository
}

func NewSalonsReadWriteHandler(repo *repositories.SalonsRepository) *SalonsReadWriteHandler {
	return &SalonsReadWriteHandler{repo: repo}
}

func (h *SalonsReadWriteHandler) GetSalon(c *gin.Context) {
	id, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	s, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	// Enforce owner (private route): token subject must match owner_id
	if uid, ok := c.Get("user_id"); ok {
		if uidStr, ok := uid.(string); ok {
			if s.OwnerID.String() != uidStr {
				Unauthorized(c, "forbidden", "Nemate pristup ovom resursu")
				return
			}
		}
	} else {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	c.JSON(http.StatusOK, s)
}

// PublicGetSalon returns a limited, public view of a salon (no sensitive fields)
func (h *SalonsReadWriteHandler) PublicGetSalon(c *gin.Context) {
	id, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	s, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	// public payload (exclude owner_id)
	c.JSON(http.StatusOK, gin.H{
		"id":       s.ID,
		"name":     s.Name,
		"phone":    s.Phone,
		"address":  s.Address,
		"timezone": s.Timezone,
		"currency": s.Currency,
	})
}

type updateSalonRequest struct {
	Name     string `json:"name" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
	Address  string `json:"address" binding:"required"`
	Timezone string `json:"timezone" binding:"required"`
	Currency string `json:"currency" binding:"required"`
}

func (h *SalonsReadWriteHandler) UpdateSalon(c *gin.Context) {
	id, err := uuid.Parse(c.Param("salon_id"))
	if err != nil {
		BadRequest(c, "invalid_salon_id", "Nepravilan ID salona")
		return
	}
	var req updateSalonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	// Optional: enforce owner can update only own salon (compare token subject to salon.owner_id)
	// Load to verify ownership
	current, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen")
		return
	}
	if uid, ok := c.Get("user_id"); ok {
		if uidStr, ok := uid.(string); ok {
			if current.OwnerID.String() != uidStr {
				Unauthorized(c, "forbidden", "Nemate dozvolu da ažurirate ovaj salon")
				return
			}
		}
	} else {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}

	s := models.Salon{ID: id, Name: req.Name, Phone: req.Phone, Address: req.Address, Timezone: req.Timezone, Currency: req.Currency}
	out, err := h.repo.Update(c.Request.Context(), s)
	if err != nil {
		ServerError(c, "update_failed", "Greška pri ažuriranju salona")
		return
	}
	c.JSON(http.StatusOK, out)
}

// GetMySalon finds the salon for the authenticated owner using token subject.
func (h *SalonsReadWriteHandler) GetMySalon(c *gin.Context) {
	uid, ok := c.Get("user_id")
	if !ok {
		Unauthorized(c, "missing_token", "Autorizacija je obavezna")
		return
	}
	uidStr, ok := uid.(string)
	if !ok {
		Unauthorized(c, "invalid_token", "Nevažeći token")
		return
	}
	ownerID, err := uuid.Parse(uidStr)
	if err != nil {
		Unauthorized(c, "invalid_token", "Nevažeći token")
		return
	}
	s, err := h.repo.GetByOwnerID(c.Request.Context(), ownerID)
	if err != nil {
		NotFound(c, "salon_not_found", "Salon nije pronađen za ovog vlasnika")
		return
	}
	c.JSON(http.StatusOK, s)
}
