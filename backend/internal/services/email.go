package services

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"
	"time"
)

type EmailService struct {
	host     string
	port     string
	username string
	password string
	from     string
}

func NewEmailService(host, port, username, password string) *EmailService {
	log.Printf("📧 Email Service initialized with host=%s, port=%s, username=%s", host, port, username)
	return &EmailService{
		host:     host,
		port:     port,
		username: username,
		password: password,
		from:     username,
	}
}

func (s *EmailService) SendAppointmentConfirmation(
	to string,
	customerName string,
	serviceName string,
	startTime time.Time,
	duration int,
	barberName string,
	salonName string,
) error {
	if to == "" {
		log.Printf("⚠️  Email not provided, skipping email send")
		return nil // No email provided, skip sending
	}

	log.Printf("📧 Preparing to send confirmation email to: %s", to)

	subject := "✅ Potvrda termina - " + salonName

	// Format date and time in Serbian
	loc, err := time.LoadLocation("Europe/Belgrade")
	if err != nil {
		loc = time.UTC
		log.Printf("⚠️  Failed to load Europe/Belgrade timezone, using UTC: %v", err)
	}
	localTime := startTime.In(loc)

	dateStr := localTime.Format("02.01.2006")
	timeStr := localTime.Format("15:04")

	// Serbian day names
	dayNames := map[time.Weekday]string{
		time.Monday:    "Ponedeljak",
		time.Tuesday:   "Utorak",
		time.Wednesday: "Sreda",
		time.Thursday:  "Četvrtak",
		time.Friday:    "Petak",
		time.Saturday:  "Subota",
		time.Sunday:    "Nedelja",
	}
	dayName := dayNames[localTime.Weekday()]

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: #18181b; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .details { background: #f9f9f9; border-left: 4px solid #18181b; padding: 20px; margin: 20px 0; }
        .details h2 { margin-top: 0; color: #18181b; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #18181b; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .emoji { font-size: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Termin Potvrđen</h1>
        </div>
        <div class="content">
            <p>Poštovani <strong>%s</strong>,</p>
            <p>Vaš termin je uspešno potvrđen!</p>
            
            <div class="details">
                <h2>📋 Detalji termina</h2>
                <div class="detail-row">
                    <span class="detail-label">📍 Salon:</span>
                    <span class="detail-value">%s</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">💈 Frizer:</span>
                    <span class="detail-value">%s</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">✂️ Usluga:</span>
                    <span class="detail-value">%s</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Datum:</span>
                    <span class="detail-value">%s, %s</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Vreme:</span>
                    <span class="detail-value">%s</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏱️ Trajanje:</span>
                    <span class="detail-value">%d minuta</span>
                </div>
            </div>
            
            <p><strong>Molimo Vas da stignete na vreme.</strong></p>
            <p>Ako želite da otkažete termin, molimo Vas da nas kontaktirate što pre.</p>
            <p>Hvala što ste odabrali nas! 🙏</p>
        </div>
        <div class="footer">
            <p>S poštovanjem,<br><strong>%s</strong></p>
            <p style="margin-top: 15px; color: #999;">Ovo je automatski generisan email. Molimo ne odgovarajte na ovu poruku.</p>
        </div>
    </div>
</body>
</html>
`, customerName, salonName, barberName, serviceName, dayName, dateStr, timeStr, duration, salonName)

	err = s.sendEmail(to, subject, htmlBody, true)
	if err != nil {
		log.Printf("❌ Failed to send confirmation email to %s: %v", to, err)
		return err
	}

	log.Printf("✅ Confirmation email sent successfully to: %s", to)
	return nil
}

func (s *EmailService) sendEmail(to, subject, body string, isHTML bool) error {
	log.Printf("📤 Attempting to send email...")
	log.Printf("   From: %s", s.from)
	log.Printf("   To: %s", to)
	log.Printf("   Subject: %s", subject)
	log.Printf("   SMTP: %s:%s", s.host, s.port)

	// Setup authentication
	auth := smtp.PlainAuth("", s.username, s.password, s.host)
	log.Printf("   Auth configured for user: %s", s.username)

	// Determine content type
	contentType := "text/plain; charset=UTF-8"
	if isHTML {
		contentType = "text/html; charset=UTF-8"
	}

	// Compose message
	msg := []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: %s\r\n"+
			"\r\n"+
			"%s\r\n",
		s.from, to, subject, contentType, body,
	))

	// Send email
	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	log.Printf("   Connecting to SMTP server: %s", addr)

	err := smtp.SendMail(addr, auth, s.from, []string{to}, msg)
	if err != nil {
		log.Printf("❌ SMTP Error: %v", err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("✅ Email sent successfully!")
	return nil
}

// SendAppointmentCancellation sends a cancellation email
func (s *EmailService) SendAppointmentCancellation(
	to string,
	customerName string,
	serviceName string,
	startTime time.Time,
	salonName string,
) error {
	if to == "" {
		return nil
	}

	subject := "Otkazivanje termina - " + salonName

	loc, _ := time.LoadLocation("Europe/Belgrade")
	localTime := startTime.In(loc)

	dateStr := localTime.Format("02.01.2006")
	timeStr := localTime.Format("15:04")

	body := fmt.Sprintf(`
Poštovani %s,

Obaveštavamo Vas da je Vaš termin otkazan.

Detalji termina:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Salon: %s
✂️  Usluga: %s
📅 Datum: %s
🕐 Vreme: %s

Ako imate bilo kakvih pitanja, molimo Vas da nas kontaktirate.

Nadamo se da ćemo Vas uskoro ponovo videti!

S poštovanjem,
%s
`, customerName, salonName, serviceName, dateStr, timeStr, salonName)

	return s.sendEmail(to, subject, body, false)
}

// Helper function to validate email format
func IsValidEmail(email string) bool {
	if email == "" {
		return false
	}
	parts := strings.Split(email, "@")
	return len(parts) == 2 && len(parts[0]) > 0 && len(parts[1]) > 0 && strings.Contains(parts[1], ".")
}
