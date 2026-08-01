import { apiClient } from './client';
import type { CreateMonitorRequest, Monitor, UpdateMonitorRequest } from '../types/monitor';

export async function listMonitors(): Promise<Monitor[]> {
  const { data } = await apiClient.get<Monitor[]>('/api/monitors');
  return data;
}

export async function getMonitor(id: string): Promise<Monitor> {
  const { data } = await apiClient.get<Monitor>(`/api/monitors/${id}`);
  return data;
}

export async function createMonitor(payload: CreateMonitorRequest): Promise<Monitor> {
  const { data } = await apiClient.post<Monitor>('/api/monitors', payload);
  return data;
}

export async function updateMonitor(id: string, payload: UpdateMonitorRequest): Promise<Monitor> {
  const { data } = await apiClient.patch<Monitor>(`/api/monitors/${id}`, payload);
  return data;
}

export async function deleteMonitor(id: string): Promise<void> {
  await apiClient.delete(`/api/monitors/${id}`);
}
