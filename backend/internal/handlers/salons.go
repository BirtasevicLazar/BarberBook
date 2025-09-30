package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
)

type SalonsHandler struct {
	svc *services.SalonsService
}

func NewSalonsHandler(svc *services.SalonsService) *SalonsHandler {
	return &SalonsHandler{svc: svc}
}

type createSalonRequest struct {
	// owner
	Email    string  `json:"email" binding:"required,email"`
	Password string  `json:"password" binding:"required,min=6"`
	FullName string  `json:"full_name" binding:"required"`
	Phone    *string `json:"phone"`
	// salon
	Name       string `json:"name" binding:"required"`
	SalonPhone string `json:"salon_phone" binding:"required"`
	Address    string `json:"address" binding:"required"`
	Timezone   string `json:"timezone"`
	Currency   string `json:"currency"`
}

func (h *SalonsHandler) CreateSalon(c *gin.Context) {
	var req createSalonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.svc.CreateSalonWithOwner(c.Request.Context(), services.CreateSalonOwnerInput{
		Email: req.Email, Password: req.Password, FullName: req.FullName, Phone: req.Phone,
		Name: req.Name, SalonPhone: req.SalonPhone, Address: req.Address, Timezone: req.Timezone, Currency: req.Currency,
	})
	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"owner": gin.H{
			"id":         res.Owner.ID,
			"email":      res.Owner.Email,
			"full_name":  res.Owner.FullName,
			"phone":      res.Owner.Phone,
			"role":       res.Owner.Role,
			"created_at": res.Owner.CreatedAt,
		},
		"salon": gin.H{
			"id":         res.Salon.ID,
			"name":       res.Salon.Name,
			"phone":      res.Salon.Phone,
			"address":    res.Salon.Address,
			"timezone":   res.Salon.Timezone,
			"currency":   res.Salon.Currency,
			"owner_id":   res.Salon.OwnerID,
			"created_at": res.Salon.CreatedAt,
		},
	})
}
