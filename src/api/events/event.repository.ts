/**
 * @fileoverview Event repository layer backed by MongoDB using mongoose
 */

import mongoose, {
  Schema,
  type FilterQuery,
  type HydratedDocument,
  type Model,
} from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type {
  Event,
  CreateEvent,
  UpdateEvent,
  EventQuery,
} from './event.schema';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type EventDocument = HydratedDocument<Event>;

const eventSchema = new Schema<Event>(
  {
    id: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    descripcion: { type: String },
    cantidad: { type: Number, required: true },
    fecha: { type: Date, required: true },
    tipo: { type: String, required: true, enum: ['ingreso', 'egreso'] },
    adjunto: { type: String },
  },
  {
    versionKey: false,
    toObject: {
      transform: (_doc, ret: Event & { _id?: unknown }): Event => {
        delete ret._id;
        return ret;
      },
    },
  },
);

const resolveModel = (): Model<Event> => {
  if (mongoose.models.Event) {
    return mongoose.models.Event as Model<Event>;
  }

  return mongoose.model<Event>('Event', eventSchema);
};

export class EventRepository {
  private readonly model: Model<Event>;

  constructor(model: Model<Event> = resolveModel()) {
    this.model = model;
  }

  async create(eventData: CreateEvent): Promise<Event> {
    const eventToCreate: Event = {
      id: uuidv4(),
      ...eventData,
    };

    const createdDoc: EventDocument = await this.model.create(eventToCreate);
    return createdDoc.toObject<Event>();
  }

  async findAll(query?: EventQuery): Promise<PaginatedResult<Event>> {
    const filter: FilterQuery<Event> = {};

    if (query?.tipo) {
      filter.tipo = query.tipo;
    }

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .skip(offset)
        .limit(limit)
        .select({ _id: 0 })
        .lean()
        .exec() as Promise<Event[]>,
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Event | null> {
    const event = await this.model
      .findOne({ id })
      .select({ _id: 0 })
      .lean()
      .exec();

    return event as Event | null;
  }

  async update(id: string, updateData: UpdateEvent): Promise<Event | null> {
    const updated = await this.model
      .findOneAndUpdate({ id }, { $set: updateData }, { new: true })
      .select({ _id: 0 })
      .lean()
      .exec();

    return updated as Event | null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ id }).exec();
    const deletedCount =
      typeof result.deletedCount === 'number' ? result.deletedCount : 0;
    return deletedCount > 0;
  }
}

export const eventRepository = new EventRepository();
