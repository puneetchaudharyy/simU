// Mirrors backend com.puneet.backend.dto.* for monitors.

export type HttpMethod = 'GET' | 'POST' | 'HEAD' | 'PUT';

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatusCode: number;
  checkIntervalSec: number;
  timeoutMs: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  method?: HttpMethod;
  expectedStatusCode?: number;
  checkIntervalSec?: number;
  timeoutMs?: number;
}

// PATCH semantics: every field optional, only provided fields are applied.
export interface UpdateMonitorRequest {
  name?: string;
  url?: string;
  method?: HttpMethod;
  expectedStatusCode?: number;
  checkIntervalSec?: number;
  timeoutMs?: number;
  active?: boolean;
}
