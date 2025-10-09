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
  dayOfWeek: number;
  startTime: string;
  endTime: string;  
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
  dayOfWeek: number; 
  startTime: string;
  endTime: string; 
}

export interface CreateBreakPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateBreakPayload extends CreateBreakPayload {}

export interface BarberTimeOff {
  id: string;
  barberId: string;
  startAt: string;
  endAt: string;   
  reason?: string | null;
}

export interface CreateTimeOffPayload {
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface UpdateTimeOffPayload extends CreateTimeOffPayload {}

export type AppointmentStatus = 'pending' | 'confirmed' | 'canceled' | 'completed';

export interface Appointment {
  id: string;
  salonId: string;
  barberId: string;
  barberServiceId: string;
  serviceName?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  price: number;
  durationMin: number;
  startAt: string; 
  endAt: string;   
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
}
