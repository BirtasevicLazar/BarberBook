export interface BarberService {
  id: string;
  barberId: string;
  name: string;
  price: number;
  durationMin: number;
  active: boolean;
  createdAt: string;
  currency?: string | null;
}

export interface CreateServicePayload {
  name: string;
  price: number;
  durationMin: number;
}

export interface UpdateServicePayload extends CreateServicePayload {
  active: boolean;
}
