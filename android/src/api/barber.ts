import { AuthCredentials, request } from './client';
import { BarberService, CreateServicePayload, UpdateServicePayload } from '../types/backend';

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
