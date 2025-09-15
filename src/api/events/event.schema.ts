/**
 * @fileoverview Event schema definitions and validation using Zod for financial event management system
 */

import { z } from 'zod';

/**
 * Enum defining the types of financial events
 * @enum {string}
 */
export const EventTipoEnum = z.enum(['ingreso', 'egreso']);

/**
 * Main event schema validation with all required and optional fields
 * @type {z.ZodObject}
 */
export const EventSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().optional(),
  cantidad: z.number().min(0, 'Cantidad debe ser mayor o igual a 0'),
  fecha: z.coerce.date(),
  tipo: EventTipoEnum,
  adjunto: z.string().url('Adjunto debe ser una URL válida').optional(),
});

/**
 * Schema for creating new events (excludes auto-generated ID field)
 * @type {z.ZodObject}
 */
export const CreateEventSchema = EventSchema.omit({ id: true });

/**
 * Schema for updating existing events (all fields optional except validation rules)
 * @type {z.ZodObject}
 */
export const UpdateEventSchema = CreateEventSchema.partial();

/**
 * Schema for query parameters when fetching events with pagination and filtering
 * @type {z.ZodObject}
 */
export const EventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  tipo: EventTipoEnum.optional(),
});

/**
 * TypeScript type representing a complete event object
 * @typedef {Object} Event
 * @property {string} id - Unique UUID identifier
 * @property {string} nombre - Event name
 * @property {string} [descripcion] - Optional event description
 * @property {number} cantidad - Event amount (must be >= 0)
 * @property {Date} fecha - Event date
 * @property {'ingreso'|'egreso'} tipo - Event type (income or expense)
 * @property {string} [adjunto] - Optional attachment URL
 */
export type Event = z.infer<typeof EventSchema>;

/**
 * TypeScript type for creating new events (without ID)
 * @typedef {Object} CreateEvent
 * @property {string} nombre - Event name
 * @property {string} [descripcion] - Optional event description
 * @property {number} cantidad - Event amount (must be >= 0)
 * @property {Date} fecha - Event date
 * @property {'ingreso'|'egreso'} tipo - Event type (income or expense)
 * @property {string} [adjunto] - Optional attachment URL
 */
export type CreateEvent = z.infer<typeof CreateEventSchema>;

/**
 * TypeScript type for updating events (all fields optional)
 * @typedef {Object} UpdateEvent
 * @property {string} [nombre] - Optional event name
 * @property {string} [descripcion] - Optional event description
 * @property {number} [cantidad] - Optional event amount (must be >= 0)
 * @property {Date} [fecha] - Optional event date
 * @property {'ingreso'|'egreso'} [tipo] - Optional event type
 * @property {string} [adjunto] - Optional attachment URL
 */
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

/**
 * TypeScript type for query parameters with pagination and filtering
 * @typedef {Object} EventQuery
 * @property {number} [page] - Page number for pagination (default: 1)
 * @property {number} [limit] - Items per page (default: 10, max: 100)
 * @property {'ingreso'|'egreso'} [tipo] - Optional filter by event type
 */
export type EventQuery = z.infer<typeof EventQuerySchema>;