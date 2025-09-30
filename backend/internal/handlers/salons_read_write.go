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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid salon_id"})
		return
	}
	s, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, s)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid salon_id"})
		return
	}
	var req updateSalonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Optional: enforce owner can update only own salon (compare token subject to salon.owner_id)
	s := models.Salon{ID: id, Name: req.Name, Phone: req.Phone, Address: req.Address, Timezone: req.Timezone, Currency: req.Currency}
	out, err := h.repo.Update(c.Request.Context(), s)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, out)
}
