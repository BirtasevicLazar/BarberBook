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
  const data = await request<BarberServiceDto[]>('/barber/services', { auth });
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
