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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .success-badge { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; font-weight: 600; }
        .details { background: linear-gradient(135deg, #f5f7fa 0%%, #c3cfe2 100%%); border-radius: 8px; padding: 25px; margin: 25px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .details h2 { margin-top: 0; color: #667eea; font-size: 20px; margin-bottom: 20px; }
        .detail-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(102, 126, 234, 0.2); }
        .detail-row:last-child { border-bottom: none; }
        .detail-icon { font-size: 24px; margin-right: 15px; min-width: 30px; }
        .detail-content { flex: 1; }
        .detail-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { font-size: 16px; color: #18181b; font-weight: 600; margin-top: 2px; }
        .reminder-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .reminder-box p { margin: 0; color: #856404; }
        .thank-you { text-align: center; font-size: 18px; color: #667eea; margin: 30px 0; font-weight: 600; }
        .footer { background: #f8f9fa; padding: 25px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
        .footer strong { color: #667eea; }
        .divider { height: 2px; background: linear-gradient(to right, transparent, #667eea, transparent); margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ Termin Uspešno Potvrđen ✨</h1>
            <p>Radujemo se Vašoj poseti!</p>
        </div>
        <div class="content">
            <p class="greeting">Poštovani <strong>%s</strong>,</p>
            
            <div class="success-badge">
                ✅ Vaša rezervacija je potvrđena i čeka Vas!
            </div>
            
            <div class="details">
                <h2>📋 Detalji Vašeg Termina</h2>
                
                <div class="detail-row">
                    <div class="detail-icon">📍</div>
                    <div class="detail-content">
                        <div class="detail-label">Salon</div>
                        <div class="detail-value">%s</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">💈</div>
                    <div class="detail-content">
                        <div class="detail-label">Vaš Frizer</div>
                        <div class="detail-value">%s</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">✂️</div>
                    <div class="detail-content">
                        <div class="detail-label">Usluga</div>
                        <div class="detail-value">%s</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">📅</div>
                    <div class="detail-content">
                        <div class="detail-label">Datum</div>
                        <div class="detail-value">%s, %s</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">🕐</div>
                    <div class="detail-content">
                        <div class="detail-label">Vreme Dolaska</div>
                        <div class="detail-value">%s</div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-icon">⏱️</div>
                    <div class="detail-content">
                        <div class="detail-label">Procenjeno Trajanje</div>
                        <div class="detail-value">%d minuta</div>
                    </div>
                </div>
            </div>
            
            <div class="reminder-box">
                <p><strong>⏰ Važno:</strong> Molimo Vas da stignete 5 minuta pre zakazanog termina.</p>
            </div>
            
            <div class="divider"></div>
            
            <p style="text-align: center; color: #666; font-size: 14px;">
                Ako iz bilo kog razloga ne možete doći, molimo Vas da nas<br>
                kontaktirate što pre kako bismo oslobodili termin za druge klijente.
            </p>
            
            <p class="thank-you">Hvala što ste odabrali nas! 🙏✨</p>
        </div>
        <div class="footer">
            <p>S poštovanjem,<br><strong>%s</strong></p>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                <p style="color: #999; font-size: 11px;">Ovo je automatski generisan email. Molimo ne odgovarajte na ovu poruku.</p>
            </div>
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

	// Setup authentication
	auth := smtp.PlainAuth("", s.username, s.password, s.host)

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
		log.Printf("⚠️  Email not provided, skipping cancellation email send")
		return nil
	}

	log.Printf("📧 Preparing to send cancellation email to: %s", to)

	subject := "❌ Otkazivanje termina - " + salonName

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
        .header { background: linear-gradient(135deg, #dc2626 0%%, #991b1b 100%%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .alert-box p { margin: 0; color: #991b1b; font-weight: 500; }
        .details { background: #f9f9f9; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
        .details h2 { margin-top: 0; color: #dc2626; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #18181b; }
        .info-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-box p { margin: 0; color: #1e40af; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Termin Otkazan</h1>
        </div>
        <div class="content">
            <p>Poštovani <strong>%s</strong>,</p>
            
            <div class="alert-box">
                <p>⚠️ Obaveštavamo Vas da je Vaš termin otkazan.</p>
            </div>
            
            <div class="details">
                <h2>📋 Detalji otkazanog termina</h2>
                <div class="detail-row">
                    <span class="detail-label">📍 Salon:</span>
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
            </div>
            
            <div class="info-box">
                <p>💡 Ako imate bilo kakvih pitanja ili želite da zakažete novi termin, molimo Vas da nas kontaktirate.</p>
            </div>
            
            <p style="text-align: center;">Nadamo se da ćemo Vas uskoro ponovo videti! 🙏</p>
        </div>
        <div class="footer">
            <p>S poštovanjem,<br><strong>%s</strong></p>
            <p style="margin-top: 15px; color: #999;">Ovo je automatski generisan email. Molimo ne odgovarajte na ovu poruku.</p>
        </div>
    </div>
</body>
</html>
`, customerName, salonName, serviceName, dayName, dateStr, timeStr, salonName)

	err = s.sendEmail(to, subject, htmlBody, true)
	if err != nil {
		log.Printf("❌ Failed to send cancellation email to %s: %v", to, err)
		return err
	}

	log.Printf("✅ Cancellation email sent successfully to: %s", to)
	return nil
}

// Helper function to validate email format
func IsValidEmail(email string) bool {
	if email == "" {
		return false
	}
	parts := strings.Split(email, "@")
	return len(parts) == 2 && len(parts[0]) > 0 && len(parts[1]) > 0 && strings.Contains(parts[1], ".")
}
