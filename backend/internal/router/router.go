package router

import (
	"net/http"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/config"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/handlers"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/middleware"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/repositories"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// New builds the gin.Engine with all routes and middlewares.
func New(db *pgxpool.Pool, cfg config.Config) *gin.Engine {
	r := gin.Default()

	// Health (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Wiring
	jwtAuth := middleware.NewJWTAuthenticator(cfg.JWTSecret)
	usersRepo := repositories.NewUsersRepository(db)
	authSvc := services.NewAuthService(usersRepo)
	authHandler := handlers.NewAuthHandler(authSvc, jwtAuth)

	salonsSvc := services.NewSalonsService(db)
	salonsHandler := handlers.NewSalonsHandler(salonsSvc)
	salonsRepo := repositories.NewSalonsRepository(db)
	salonsRW := handlers.NewSalonsReadWriteHandler(salonsRepo)

	api := r.Group("/api/v1")
	{
		// Public routes
		api.POST("/salons", salonsHandler.CreateSalon) // create salon + owner
		api.POST("/auth/login", authHandler.Login)     // owner login

		// Private (owner dashboard): require JWT
		authz := api.Group("")
		authz.Use(jwtAuth.Middleware())
		{
			// Read single salon (može biti i public, ali za sada privatno)
			authz.GET("/salons/:salon_id", salonsRW.GetSalon)
			// Update salon
			authz.PUT("/salons/:salon_id", salonsRW.UpdateSalon)
		}
	}

	return r
}
