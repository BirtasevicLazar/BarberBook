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
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	userID, role, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		Unauthorized(c, "invalid_credentials", "Pogrešan email ili lozinka")
		return
	}
	tok, err := h.jwtAu.GenerateToken(userID, role)
	if err != nil {
		ServerError(c, "token_issue_failed", "Greška pri kreiranju tokena")
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": tok, "token_type": "Bearer"})
}

// OwnerLogin is a login endpoint specifically for salon owners (web dashboard).
// It validates credentials and ensures the user has role="owner".
func (h *AuthHandler) OwnerLogin(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	userID, role, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		Unauthorized(c, "invalid_credentials", "Pogrešan email ili lozinka")
		return
	}
	// Ensure only owners can login through this endpoint
	if role != "owner" {
		Unauthorized(c, "not_owner", "Ovaj login je samo za vlasnike salona")
		return
	}
	tok, err := h.jwtAu.GenerateToken(userID, role)
	if err != nil {
		ServerError(c, "token_issue_failed", "Greška pri kreiranju tokena")
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": tok, "token_type": "Bearer"})
}

// BarberLogin is a login endpoint specifically for barbers (mobile app).
// It validates credentials and ensures the user has role="barber".
func (h *AuthHandler) BarberLogin(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		BadRequest(c, "invalid_body", "Nepravilno poslati podaci")
		return
	}
	userID, role, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		Unauthorized(c, "invalid_credentials", "Pogrešan email ili lozinka")
		return
	}
	// Ensure only barbers can login through this endpoint
	if role != "barber" {
		Unauthorized(c, "not_barber", "Ovaj login je samo za frizere")
		return
	}
	tok, err := h.jwtAu.GenerateToken(userID, role)
	if err != nil {
		ServerError(c, "token_issue_failed", "Greška pri kreiranju tokena")
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": tok, "token_type": "Bearer"})
}
