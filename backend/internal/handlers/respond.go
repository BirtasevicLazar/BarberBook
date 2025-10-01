package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func JSONError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": apiError{Code: code, Message: message}})
}

func BadRequest(c *gin.Context, code, message string) {
	JSONError(c, http.StatusBadRequest, code, message)
}
func Unauthorized(c *gin.Context, code, message string) {
	JSONError(c, http.StatusUnauthorized, code, message)
}
func NotFound(c *gin.Context, code, message string) { JSONError(c, http.StatusNotFound, code, message) }
func Conflict(c *gin.Context, code, message string) { JSONError(c, http.StatusConflict, code, message) }
func ServerError(c *gin.Context, code, message string) {
	JSONError(c, http.StatusInternalServerError, code, message)
}
