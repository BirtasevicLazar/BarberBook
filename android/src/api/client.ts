import { Platform } from 'react-native';
import { API_BASE_URL } from '@env';

export interface ApiErrorShape {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code?: string;
  details?: unknown;

  constructor({ status, code, message, details }: ApiErrorShape) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface AuthCredentials {
  token: string;
  tokenType?: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  auth?: AuthCredentials;
  signal?: AbortSignal;
}

const BASE_HOST = API_BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_HOST}/api/v1`;

function resolveUrl(path: string): string {
  if (!path) {
    throw new Error('Path is required');
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (!path.startsWith('/')) {
    return `${API_BASE}/${path}`;
  }
  return `${API_BASE}${path}`;
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, auth, signal } = options;
  const isJsonBody = body && typeof body === 'object' && !(body instanceof FormData);

  const finalHeaders: Record<string, string> = {
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    Accept: 'application/json',
    ...headers,
  };

  if (auth?.token) {
    finalHeaders.Authorization = `${auth.tokenType ?? 'Bearer'} ${auth.token}`;
  }

  const response = await fetch(resolveUrl(path), {
    method,
    headers: finalHeaders,
    body: isJsonBody ? JSON.stringify(body) : (body as any),
    signal,
  });

  const rawText = await response.text();
  let data: unknown = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null
        ? ((data as { error?: { message?: string }; message?: string }).error?.message ??
           (data as { message?: string }).message ??
           response.statusText)
        : response.statusText;

    throw new ApiError({
      status: response.status,
      code:
        typeof data === 'object' && data !== null
          ? (data as { error?: { code?: string } }).error?.code
          : undefined,
      message,
      details: data,
    });
  }

  return data as T;
}

export { BASE_HOST, API_BASE };
