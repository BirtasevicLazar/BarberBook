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

export interface BarberWorkingHour {
  id: string;
  barberId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // ISO 8601 datetime
  endTime: string;   // ISO 8601 datetime
}

export interface CreateWorkingHourPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateWorkingHourPayload extends CreateWorkingHourPayload {}

export interface BarberBreak {
  id: string;
  barberId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // ISO 8601 datetime
  endTime: string;   // ISO 8601 datetime
}

export interface CreateBreakPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateBreakPayload extends CreateBreakPayload {}
