package router

import (
	"net/http"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/config"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/handlers"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/middleware"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/repositories"
	"github.com/BirtasevicLazar/BarberBook/backend/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// New builds the gin.Engine with all routes and middlewares.
func New(db *pgxpool.Pool, cfg config.Config) *gin.Engine {
	r := gin.Default()
	// Avoid trusted proxy warning; in production, configure via env as needed.
	_ = r.SetTrustedProxies(nil)

	// CORS (dev-friendly default). Optionally tighten with AllowedOrigins from env.
	r.Use(cors.Default())

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
	barbersSvc := services.NewBarbersService(db)
	barbersHandler := handlers.NewBarbersHandler(barbersSvc, salonsRepo)
	barberServicesSvc := services.NewBarberServicesService(db)
	barberServicesHandler := handlers.NewBarberServicesHandler(barberServicesSvc, barbersSvc)
	availabilitySvc := services.NewAvailabilityService(db)
	publicHandler := handlers.NewPublicHandler(barbersSvc, barberServicesSvc, availabilitySvc)
	workingHoursSvc := services.NewWorkingHoursService(db)
	breaksSvc := services.NewBreaksService(db)
	barberScheduleHandler := handlers.NewBarberScheduleHandler(barbersSvc, workingHoursSvc, breaksSvc)
	timeOffSvc := services.NewTimeOffService(db)
	barberTimeOffHandler := handlers.NewBarberTimeOffHandler(barbersSvc, timeOffSvc)
	appointmentsSvc := services.NewAppointmentsService(db)
	appointmentsHandler := handlers.NewAppointmentsHandler(appointmentsSvc, barbersSvc)

	api := r.Group("/api/v1")
	{
		// Public routes
		api.POST("/salons", salonsHandler.CreateSalon)               // create salon + owner
		api.POST("/auth/login", authHandler.Login)                   // owner login
		api.GET("/public/salons/:salon_id", salonsRW.PublicGetSalon) // public read-only salon profile
		api.GET("/public/salons/:salon_id/barbers", publicHandler.ListActiveBarbers)
		api.GET("/public/barbers/:barber_id/services", publicHandler.ListActiveServices)
		api.GET("/public/barbers/:barber_id/services/:service_id/availability", publicHandler.Availability)
		api.POST("/public/appointments", appointmentsHandler.PublicCreate) // customers can only book

		// Private (dashboard): require JWT
		authz := api.Group("")
		authz.Use(jwtAuth.Middleware())
		{
			// Barber self endpoints
			barbersOnly := authz.Group("")
			barbersOnly.Use(jwtAuth.RequireRole("barber"))
			{
				barbersOnly.GET("/barber/me", barbersHandler.Me)
				// Barber services CRUD
				barbersOnly.GET("/barber/services", barberServicesHandler.List)
				barbersOnly.POST("/barber/services", barberServicesHandler.Create)
				barbersOnly.PUT("/barber/services/:service_id", barberServicesHandler.Update)
				barbersOnly.DELETE("/barber/services/:service_id", barberServicesHandler.Deactivate)
				// Working hours
				barbersOnly.GET("/barber/working-hours", barberScheduleHandler.ListHours)
				barbersOnly.POST("/barber/working-hours", barberScheduleHandler.CreateHour)
				barbersOnly.PUT("/barber/working-hours/:hour_id", barberScheduleHandler.UpdateHour)
				barbersOnly.DELETE("/barber/working-hours/:hour_id", barberScheduleHandler.DeleteHour)
				// Breaks
				barbersOnly.GET("/barber/breaks", barberScheduleHandler.ListBreaks)
				barbersOnly.POST("/barber/breaks", barberScheduleHandler.CreateBreak)
				barbersOnly.PUT("/barber/breaks/:break_id", barberScheduleHandler.UpdateBreak)
				barbersOnly.DELETE("/barber/breaks/:break_id", barberScheduleHandler.DeleteBreak)
				// Time off
				barbersOnly.GET("/barber/time-off", barberTimeOffHandler.List)
				barbersOnly.POST("/barber/time-off", barberTimeOffHandler.Create)
				barbersOnly.PUT("/barber/time-off/:timeoff_id", barberTimeOffHandler.Update)
				barbersOnly.DELETE("/barber/time-off/:timeoff_id", barberTimeOffHandler.Delete)
				// Barber appointments: list and cancel
				barbersOnly.GET("/barber/appointments", appointmentsHandler.ListForBarber)
				barbersOnly.POST("/barber/appointments/:appointment_id/cancel", appointmentsHandler.CancelByBarber)
			}

			// Read single salon (može biti i public, ali za sada privatno)
			authz.GET("/salons/:salon_id", salonsRW.GetSalon)
			// Update salon
			authz.PUT("/salons/:salon_id", salonsRW.UpdateSalon)
			// Owner-only group for managing barbers
			owners := authz.Group("")
			owners.Use(jwtAuth.RequireRole("owner"))
			{
				// Add barber to salon
				owners.POST("/salons/:salon_id/barbers", barbersHandler.CreateBarber)
				// Barbers CRUD
				owners.GET("/salons/:salon_id/barbers", barbersHandler.ListBarbers)
				owners.GET("/salons/:salon_id/barbers/:barber_id", barbersHandler.GetBarber)
				owners.PUT("/salons/:salon_id/barbers/:barber_id", barbersHandler.UpdateBarber)
				owners.DELETE("/salons/:salon_id/barbers/:barber_id", barbersHandler.DeactivateBarber)
			}
		}
	}

	return r
}
