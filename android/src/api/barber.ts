import { AuthCredentials, request } from './client';
import { 
  BarberService, 
  CreateServicePayload, 
  UpdateServicePayload,
  BarberWorkingHour,
  CreateWorkingHourPayload,
  UpdateWorkingHourPayload,
  BarberBreak,
  CreateBreakPayload,
  UpdateBreakPayload,
  BarberTimeOff,
  CreateTimeOffPayload,
  UpdateTimeOffPayload,
  Appointment,
  AppointmentStatus,
} from '../types/backend';

interface BarberServiceDto {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  duration_min: number;
  active: boolean;
  created_at: string;
  currency?: string | null;
}

function mapBarberService(dto: BarberServiceDto): BarberService {
  return {
    id: dto.id,
    barberId: dto.barber_id,
    name: dto.name,
    price: dto.price,
    durationMin: dto.duration_min,
    active: dto.active,
    createdAt: dto.created_at,
    currency: dto.currency ?? null,
  };
}

export interface BarberProfile {
  id: string;
  userId: string;
  salonId: string;
  displayName: string;
  active: boolean;
  slotDurationMinutes: number;
  createdAt: string;
}

interface BarberProfileDto {
  id: string;
  user_id: string;
  salon_id: string;
  display_name: string;
  active: boolean;
  slot_duration_minutes: number;
  created_at: string;
}

export async function getBarberProfile(auth: AuthCredentials): Promise<BarberProfile> {
  const data = await request<BarberProfileDto>('/barber/me', { auth });
  return {
    id: data.id,
    userId: data.user_id,
    salonId: data.salon_id,
    displayName: data.display_name,
    active: data.active,
    slotDurationMinutes: data.slot_duration_minutes,
    createdAt: data.created_at,
  };
}

interface WorkingHourDto {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

function mapWorkingHour(dto: WorkingHourDto): BarberWorkingHour {
  return {
    id: dto.id,
    barberId: dto.barber_id,
    dayOfWeek: dto.day_of_week,
    startTime: dto.start_time,
    endTime: dto.end_time,
  };
}

interface BreakDto {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

function mapBreak(dto: BreakDto): BarberBreak {
  return {
    id: dto.id,
    barberId: dto.barber_id,
    dayOfWeek: dto.day_of_week,
    startTime: dto.start_time,
    endTime: dto.end_time,
  };
}

export async function listBarberServices(auth: AuthCredentials): Promise<BarberService[]> {
  const data = await request<BarberServiceDto[] | null>('/barber/services', { auth });
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data.map(mapBarberService);
}

export async function createBarberService(auth: AuthCredentials, payload: CreateServicePayload): Promise<BarberService> {
  const data = await request<BarberServiceDto>('/barber/services', {
    method: 'POST',
    auth,
    body: {
      name: payload.name,
      price: payload.price,
      duration_min: payload.durationMin,
    },
  });
  return mapBarberService(data);
}

export async function updateBarberService(
  auth: AuthCredentials,
  serviceId: string,
  payload: UpdateServicePayload,
): Promise<BarberService> {
  const data = await request<BarberServiceDto>(`/barber/services/${serviceId}`, {
    method: 'PUT',
    auth,
    body: {
      name: payload.name,
      price: payload.price,
      duration_min: payload.durationMin,
      active: payload.active,
    },
  });
  return mapBarberService(data);
}

export async function deleteBarberService(auth: AuthCredentials, serviceId: string): Promise<void> {
  await request(`/barber/services/${serviceId}`, {
    method: 'DELETE',
    auth,
  });
}

// ===== Working Hours API =====

export async function listWorkingHours(auth: AuthCredentials): Promise<BarberWorkingHour[]> {
  const data = await request<WorkingHourDto[] | null>('/barber/working-hours', { auth });
  // Handle null response from backend (when no data exists)
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data.map(mapWorkingHour);
}

export async function createWorkingHour(
  auth: AuthCredentials, 
  payload: CreateWorkingHourPayload
): Promise<BarberWorkingHour> {
  const data = await request<WorkingHourDto>('/barber/working-hours', {
    method: 'POST',
    auth,
    body: {
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
    },
  });
  return mapWorkingHour(data);
}

export async function updateWorkingHour(
  auth: AuthCredentials,
  hourId: string,
  payload: UpdateWorkingHourPayload,
): Promise<BarberWorkingHour> {
  const data = await request<WorkingHourDto>(`/barber/working-hours/${hourId}`, {
    method: 'PUT',
    auth,
    body: {
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
    },
  });
  return mapWorkingHour(data);
}

export async function deleteWorkingHour(auth: AuthCredentials, hourId: string): Promise<void> {
  await request(`/barber/working-hours/${hourId}`, {
    method: 'DELETE',
    auth,
  });
}

// ===== Breaks API =====

export async function listBreaks(auth: AuthCredentials): Promise<BarberBreak[]> {
  const data = await request<BreakDto[] | null>('/barber/breaks', { auth });
  // Handle null response from backend (when no data exists)
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data.map(mapBreak);
}

export async function createBreak(
  auth: AuthCredentials, 
  payload: CreateBreakPayload
): Promise<BarberBreak> {
  const data = await request<BreakDto>('/barber/breaks', {
    method: 'POST',
    auth,
    body: {
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
    },
  });
  return mapBreak(data);
}

export async function updateBreak(
  auth: AuthCredentials,
  breakId: string,
  payload: UpdateBreakPayload,
): Promise<BarberBreak> {
  const data = await request<BreakDto>(`/barber/breaks/${breakId}`, {
    method: 'PUT',
    auth,
    body: {
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
    },
  });
  return mapBreak(data);
}

export async function deleteBreak(auth: AuthCredentials, breakId: string): Promise<void> {
  await request(`/barber/breaks/${breakId}`, {
    method: 'DELETE',
    auth,
  });
}

// Time Off API
interface TimeOffDto {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  reason?: string | null;
}

function mapTimeOff(dto: TimeOffDto): BarberTimeOff {
  return {
    id: dto.id,
    barberId: dto.barber_id,
    startAt: dto.start_at,
    endAt: dto.end_at,
    reason: dto.reason ?? null,
  };
}

export async function listTimeOff(auth: AuthCredentials): Promise<BarberTimeOff[]> {
  const data = await request<TimeOffDto[] | null>('/barber/time-off', { auth });
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data.map(mapTimeOff);
}

export async function createTimeOff(
  auth: AuthCredentials,
  payload: CreateTimeOffPayload
): Promise<BarberTimeOff> {
  const data = await request<TimeOffDto>('/barber/time-off', {
    method: 'POST',
    auth,
    body: {
      start_at: payload.startAt,
      end_at: payload.endAt,
      reason: payload.reason || null,
    },
  });
  return mapTimeOff(data);
}

export async function updateTimeOff(
  auth: AuthCredentials,
  timeOffId: string,
  payload: UpdateTimeOffPayload
): Promise<BarberTimeOff> {
  const data = await request<TimeOffDto>(`/barber/time-off/${timeOffId}`, {
    method: 'PUT',
    auth,
    body: {
      start_at: payload.startAt,
      end_at: payload.endAt,
      reason: payload.reason || null,
    },
  });
  return mapTimeOff(data);
}

export async function deleteTimeOff(auth: AuthCredentials, timeOffId: string): Promise<void> {
  await request(`/barber/time-off/${timeOffId}`, {
    method: 'DELETE',
    auth,
  });
}

// ===== Appointments API =====

interface AppointmentDto {
  id: string;
  salon_id: string;
  barber_id: string;
  barber_service_id: string;
  service_name?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  price: number;
  duration_min: number;
  start_at: string;
  end_at: string;
  status: string;
  notes?: string | null;
  created_at: string;
}

function mapAppointment(dto: AppointmentDto): Appointment {
  return {
    id: dto.id,
    salonId: dto.salon_id,
    barberId: dto.barber_id,
    barberServiceId: dto.barber_service_id,
    serviceName: dto.service_name ?? null,
    customerName: dto.customer_name,
    customerPhone: dto.customer_phone ?? null,
    price: dto.price,
    durationMin: dto.duration_min,
    startAt: dto.start_at,
    endAt: dto.end_at,
    status: dto.status as AppointmentStatus,
    notes: dto.notes ?? null,
    createdAt: dto.created_at,
  };
}

export async function listAppointments(
  auth: AuthCredentials,
  params?: { from?: string; to?: string; status?: string }
): Promise<Appointment[]> {
  const queryParams = new URLSearchParams();
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);
  if (params?.status) queryParams.append('status', params.status);
  
  const path = `/barber/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const data = await request<AppointmentDto[] | null>(path, { auth });
  
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data.map(mapAppointment);
}

export async function confirmAppointment(
  auth: AuthCredentials,
  appointmentId: string
): Promise<Appointment> {
  const data = await request<AppointmentDto>(`/barber/appointments/${appointmentId}/confirm`, {
    method: 'POST',
    auth,
  });
  return mapAppointment(data);
}

export async function cancelAppointment(
  auth: AuthCredentials,
  appointmentId: string
): Promise<Appointment> {
  const data = await request<AppointmentDto>(`/barber/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    auth,
  });
  return mapAppointment(data);
}

export async function deleteAppointment(
  auth: AuthCredentials,
  appointmentId: string
): Promise<void> {
  await request(`/barber/appointments/${appointmentId}`, {
    method: 'DELETE',
    auth,
  });
}

export interface CreateAppointmentPayload {
  salonId: string;
  barberId: string;
  barberServiceId: string;
  customerName: string;
  customerPhone?: string;
  startAt: string; // ISO 8601 datetime
  notes?: string;
}

export async function createAppointment(
  auth: AuthCredentials,
  payload: CreateAppointmentPayload
): Promise<Appointment> {
  const body = {
    salon_id: payload.salonId,
    barber_id: payload.barberId,
    barber_service_id: payload.barberServiceId,
    customer_name: payload.customerName,
    customer_phone: payload.customerPhone || null,
    start_at: payload.startAt,
    notes: payload.notes || null,
  };
  
  const data = await request<AppointmentDto>('/public/appointments', {
    method: 'POST',
    auth,
    body,
  });
  return mapAppointment(data);
}
