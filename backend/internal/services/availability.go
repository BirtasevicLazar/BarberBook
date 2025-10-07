package services

import (
	"context"
	"sort"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AvailabilityService struct{ db *pgxpool.Pool }

func NewAvailabilityService(db *pgxpool.Pool) *AvailabilityService {
	return &AvailabilityService{db: db}
}

type AvailabilityInput struct {
	BarberID  uuid.UUID
	ServiceID uuid.UUID
	Date      time.Time // date-only (local to salon timezone ideally); we use date part
}

type Slot struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

type AvailabilityResponse struct {
	Slots       []Slot  `json:"slots"`
	IsTimeOff   bool    `json:"is_time_off"`
	TimeOffInfo *string `json:"time_off_info,omitempty"`
}

// internal interval type used for availability calculations
type iv struct{ s, e time.Time }

// Compute availability by intersecting working hours for the weekday, subtracting breaks and time off, and removing existing appointments; then tile by service duration
func (s *AvailabilityService) GetDailyAvailability(ctx context.Context, in AvailabilityInput) (AvailabilityResponse, error) {
	// Fetch service duration
	var durationMin int
	if err := s.db.QueryRow(ctx, `SELECT duration_min FROM barber_services WHERE id=$1 AND barber_id=$2 AND active=true`, in.ServiceID, in.BarberID).Scan(&durationMin); err != nil {
		return AvailabilityResponse{}, err
	}
	// Resolve salon timezone via barber -> salon
	var tz string
	if err := s.db.QueryRow(ctx, `SELECT s.timezone FROM salons s JOIN barbers b ON b.salon_id = s.id WHERE b.id=$1`, in.BarberID).Scan(&tz); err != nil {
		return AvailabilityResponse{}, err
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}
	// Define day range (UTC-based for now; could adapt to salon tz later)
	dayStart := time.Date(in.Date.In(loc).Year(), in.Date.In(loc).Month(), in.Date.In(loc).Day(), 0, 0, 0, 0, loc)
	dayEnd := dayStart.Add(24 * time.Hour)
	weekday := int(dayStart.Weekday())
	// Working hours
	whRows, err := s.db.Query(ctx, `SELECT start_time, end_time FROM barber_working_hours WHERE barber_id=$1 AND day_of_week=$2 ORDER BY start_time`, in.BarberID, weekday)
	if err != nil {
		return AvailabilityResponse{}, err
	}
	defer whRows.Close()
	var working []iv
	for whRows.Next() {
		var st, en time.Time
		if err := whRows.Scan(&st, &en); err != nil {
			return AvailabilityResponse{}, err
		}
		working = append(working, iv{s: combineDate(dayStart, st), e: combineDate(dayStart, en)})
	}
	// Breaks
	brRows, err := s.db.Query(ctx, `SELECT start_time, end_time FROM barber_breaks WHERE barber_id=$1 AND day_of_week=$2`, in.BarberID, weekday)
	if err != nil {
		return AvailabilityResponse{}, err
	}
	defer brRows.Close()
	var breaks []iv
	for brRows.Next() {
		var st, en time.Time
		if err := brRows.Scan(&st, &en); err != nil {
			return AvailabilityResponse{}, err
		}
		breaks = append(breaks, iv{s: combineDate(dayStart, st), e: combineDate(dayStart, en)})
	}
	// Time off overlapping this day - also fetch reason
	toRows, err := s.db.Query(ctx, `SELECT start_at, end_at, reason FROM barber_time_off WHERE barber_id=$1 AND NOT (end_at <= $2 OR start_at >= $3)`, in.BarberID, dayStart, dayEnd)
	if err != nil {
		return AvailabilityResponse{}, err
	}
	defer toRows.Close()
	var offs []iv
	var timeOffReason *string
	for toRows.Next() {
		var st, en time.Time
		var reason *string
		if err := toRows.Scan(&st, &en, &reason); err != nil {
			return AvailabilityResponse{}, err
		}
		offs = append(offs, iv{s: st, e: en})
		// Store the first reason found (if multiple time-offs, we use the first one)
		if timeOffReason == nil && reason != nil {
			timeOffReason = reason
		}
	}
	// Appointments for the day (excluding canceled)
	apRows, err := s.db.Query(ctx, `SELECT start_at, end_at FROM appointments WHERE barber_id=$1 AND status <> 'canceled' AND start_at >= $2 AND start_at < $3`, in.BarberID, dayStart, dayEnd)
	if err != nil {
		return AvailabilityResponse{}, err
	}
	defer apRows.Close()
	var busy []iv
	for apRows.Next() {
		var st, en time.Time
		if err := apRows.Scan(&st, &en); err != nil {
			return AvailabilityResponse{}, err
		}
		busy = append(busy, iv{s: st, e: en})
	}

	// Check if entire day is blocked by time off
	isTimeOff := len(offs) > 0
	var timeOffInfo *string
	if isTimeOff {
		// Build info string
		info := "Frizer ne radi"
		if timeOffReason != nil && *timeOffReason != "" {
			info = *timeOffReason
		}
		timeOffInfo = &info
	}

	// Start with working intervals, subtract breaks, time_off and busy
	free := working
	free = subtractIntervals(free, breaks)
	free = subtractIntervals(free, offs)
	free = subtractIntervals(free, busy)
	// Tile by duration
	var slots []Slot
	step := time.Duration(durationMin) * time.Minute
	for _, w := range free {
		t := w.s
		for t.Add(step).Equal(w.e) || t.Add(step).Before(w.e) {
			slots = append(slots, Slot{Start: t, End: t.Add(step)})
			t = t.Add(step)
		}
	}
	// sort
	sort.Slice(slots, func(i, j int) bool { return slots[i].Start.Before(slots[j].Start) })

	return AvailabilityResponse{
		Slots:       slots,
		IsTimeOff:   isTimeOff,
		TimeOffInfo: timeOffInfo,
	}, nil
}

func combineDate(day time.Time, tod time.Time) time.Time {
	y, m, d := day.Date()
	h, min, s := tod.Clock()
	return time.Date(y, m, d, h, min, s, 0, day.Location())
}

func subtractIntervals(base, sub []iv) []iv {
	out := base
	for _, s := range sub {
		var next []iv
		for _, b := range out {
			// no overlap if s ends before or at b starts, OR s starts after or at b ends
			if s.e.Before(b.s) || s.e.Equal(b.s) || s.s.After(b.e) || s.s.Equal(b.e) {
				// No overlap, keep the entire base interval
				next = append(next, b)
				continue
			}
			// There is overlap, split the base interval
			// Keep the part before the subtraction (if any)
			if s.s.After(b.s) {
				next = append(next, iv{s: b.s, e: s.s})
			}
			// Keep the part after the subtraction (if any)
			if s.e.Before(b.e) {
				next = append(next, iv{s: s.e, e: b.e})
			}
		}
		out = next
	}
	return out
}
