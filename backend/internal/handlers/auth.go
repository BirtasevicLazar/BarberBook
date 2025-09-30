package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/middleware"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
)

type AuthHandler struct {
	svc   *services.AuthService
	jwtAu *middleware.JWTAuthenticator
}

func NewAuthHandler(svc *services.AuthService, jwtAu *middleware.JWTAuthenticator) *AuthHandler {
	return &AuthHandler{svc: svc, jwtAu: jwtAu}
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, role, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	tok, err := h.jwtAu.GenerateToken(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to issue token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": tok, "token_type": "Bearer"})
}
