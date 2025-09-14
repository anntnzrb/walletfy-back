import { z } from 'zod';

export const EventTipoEnum = z.enum(['ingreso', 'egreso']);

export const EventSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  descripcion: z.string().optional(),
  cantidad: z.number().min(0, 'Cantidad debe ser mayor o igual a 0'),
  fecha: z.coerce.date(),
  tipo: EventTipoEnum,
  adjunto: z.string().url('Adjunto debe ser una URL válida').optional(),
});

export const CreateEventSchema = EventSchema.omit({ id: true });

export const UpdateEventSchema = CreateEventSchema.partial();

export const EventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  tipo: EventTipoEnum.optional(),
});

export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;
export type EventQuery = z.infer<typeof EventQuerySchema>;