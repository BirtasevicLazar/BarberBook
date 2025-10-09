package services

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"

	"github.com/BirtasevicLazar/BarberBook/backend/internal/repositories"
)

type AuthService struct {
	users *repositories.UsersRepository
}

func NewAuthService(users *repositories.UsersRepository) *AuthService {
	return &AuthService{users: users}
}

// Login validates credentials; returns userID and role on success.
func (s *AuthService) Login(ctx context.Context, email, password string) (string, string, error) {
	u, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return "", "", errors.New("Pogrešan email ili lozinka")
	}
	if bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
		return "", "", errors.New("Pogrešan email ili lozinka")
	}
	return u.ID.String(), u.Role, nil
}
