/**
 * @fileoverview View helpers responsible for shaping Event responses
 */

import type { Event } from '@validators/event.validator';
import type { PaginatedResult } from '@models/event.model';

type EventLike = Omit<Event, 'fecha'> & { fecha: Date | string };

/**
 * Serializable representation of an Event exposed over HTTP
 */
export interface EventResponse {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  fecha: string;
  tipo: Event['tipo'];
  adjunto?: string;
}

/**
 * Serializable representation of a paginated Event collection
 */
export interface PaginatedEventResponse {
  data: EventResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const toIsoString = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

/**
 * Renders an Event into its transport-friendly representation
 */
export const renderEvent = (event: EventLike): EventResponse => {
  return {
    id: event.id,
    nombre: event.nombre,
    descripcion: event.descripcion,
    cantidad: event.cantidad,
    fecha: toIsoString(event.fecha),
    tipo: event.tipo,
    adjunto: event.adjunto,
  };
};

/**
 * Renders a paginated Event result into a serializable structure
 */
export const renderEventCollection = (
  result: PaginatedResult<EventLike>,
): PaginatedEventResponse => {
  return {
    data: result.data.map(renderEvent),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
};
