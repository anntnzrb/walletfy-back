/**
 * @fileoverview Event model layer backed by MongoDB using mongoose
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
} from '@validators/event.validator';

/**
 * Paginated result wrapper for model queries
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Hydrated mongoose document representing an Event */
type EventDocument = HydratedDocument<Event>;

/**
 * Mongoose schema definition mirroring the Event domain model
 */
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

// Add indexes for optimal query performance
eventSchema.index({ tipo: 1, fecha: -1 }); // For filtered queries
eventSchema.index({ fecha: -1 }); // For date-based sorting
eventSchema.index({ cantidad: -1 }); // For amount-based sorting

const resolveModel = (): Model<Event> => {
  return (
    (mongoose.models.Event as Model<Event> | undefined) ??
    mongoose.model<Event>('Event', eventSchema)
  );
};

/**
 * Model providing CRUD operations for Event entities stored in MongoDB
 */
export class EventModel {
  private readonly model: Model<Event>;

  /**
   * @param model Optional mongoose model (exposed for testing)
   */
  constructor(model: Model<Event> = resolveModel()) {
    this.model = model;
  }

  /**
   * Persists a new event and returns the created entity with generated id
   */
  async create(eventData: CreateEvent): Promise<Event> {
    const eventToCreate: Event = {
      id: uuidv4(),
      ...eventData,
    };

    const createdDoc: EventDocument = await this.model.create(eventToCreate);
    return createdDoc.toObject<Event>();
  }

  /**
   * Retrieves events applying optional filters and pagination
   */
  async findAll(query?: EventQuery): Promise<PaginatedResult<Event>> {
    const {
      tipo,
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'asc',
    } = query ?? {};
    const filter: FilterQuery<Event> = tipo ? { tipo } : {};
    const offset = Math.min((page - 1) * limit, 1000000); // Clamp to prevent overflow/huge skips
    const sortDirection: mongoose.SortOrder = sortOrder === 'desc' ? -1 : 1;
    const sortCriteria: Record<string, mongoose.SortOrder> | undefined = sortBy
      ? { [sortBy]: sortDirection }
      : undefined;

    const queryBuilder = this.model.find(filter).skip(offset).limit(limit);

    if (sortCriteria) {
      queryBuilder.sort(sortCriteria);
    }

    const [data, total] = await Promise.all([
      queryBuilder.select({ _id: 0 }).lean().exec() as Promise<Event[]>,
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

  /**
   * Finds an event by its UUID identifier
   */
  async findById(id: string): Promise<Event | null> {
    const event = await this.model
      .findOne({ id })
      .select({ _id: 0 })
      .lean()
      .exec();

    return event as Event | null;
  }

  /**
   * Updates an existing event and returns the modified entity, if found
   */
  async update(id: string, updateData: UpdateEvent): Promise<Event | null> {
    const updated = await this.model
      .findOneAndUpdate({ id }, { $set: updateData }, { new: true })
      .select({ _id: 0 })
      .lean()
      .exec();

    return updated as Event | null;
  }

  /**
   * Removes an event by id and indicates whether a document was deleted
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ id }).exec();
    const deletedCount =
      typeof result.deletedCount === 'number' ? result.deletedCount : 0;
    return deletedCount > 0;
  }
}

/**
 * Singleton EventModel instance used across controllers
 */
export const eventModel = new EventModel();
