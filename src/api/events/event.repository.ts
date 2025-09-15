/**
 * @fileoverview Event repository layer for data access operations with in-memory storage
 */

import type {
  Event,
  CreateEvent,
  UpdateEvent,
  EventQuery,
} from './event.schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for paginated query results
 * @interface PaginatedResult
 * @template T - The type of data being paginated
 * @property {T[]} data - Array of items for current page
 * @property {number} total - Total number of items across all pages
 * @property {number} page - Current page number
 * @property {number} limit - Number of items per page
 * @property {number} totalPages - Total number of pages
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Repository class for managing event data with CRUD operations
 * Uses in-memory storage for events
 */
export class EventRepository {
  /**
   * In-memory storage for events
   * @private
   * @type {Event[]}
   */
  private events: Event[] = [];

  /**
   * Creates a new event and stores it in memory
   * @param {CreateEvent} eventData - Event data without ID
   * @returns {Promise<Event>} Promise resolving to the created event with generated ID
   * @example
   * const event = await repository.create({
   *   nombre: 'Salary',
   *   cantidad: 5000,
   *   fecha: new Date(),
   *   tipo: 'ingreso'
   * });
   */
  create(eventData: CreateEvent): Promise<Event> {
    const event: Event = {
      id: uuidv4(),
      ...eventData,
    };

    this.events.push(event);
    return Promise.resolve(event);
  }

  /**
   * Retrieves all events with optional filtering and pagination
   * @param {EventQuery} [query] - Optional query parameters for filtering and pagination
   * @returns {Promise<PaginatedResult<Event>>} Promise resolving to paginated events result
   * @example
   * const result = await repository.findAll({ page: 1, limit: 10, tipo: 'ingreso' });
   */
  findAll(query?: EventQuery): Promise<PaginatedResult<Event>> {
    let filteredEvents = [...this.events];

    if (query?.tipo) {
      filteredEvents = filteredEvents.filter(
        (event) => event.tipo === query.tipo,
      );
    }

    const total = filteredEvents.length;
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const offset = (page - 1) * limit;

    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return Promise.resolve({
      data: paginatedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  /**
   * Finds a single event by its ID
   * @param {string} id - UUID of the event to find
   * @returns {Promise<Event | null>} Promise resolving to found event or null if not found
   * @example
   * const event = await repository.findById('123e4567-e89b-12d3-a456-426614174000');
   */
  findById(id: string): Promise<Event | null> {
    const event = this.events.find((event) => event.id === id);
    return Promise.resolve(event ?? null);
  }

  /**
   * Updates an existing event with new data
   * @param {string} id - UUID of the event to update
   * @param {UpdateEvent} updateData - Partial event data with updates
   * @returns {Promise<Event | null>} Promise resolving to updated event or null if not found
   * @example
   * const updated = await repository.update('123e4567...', { cantidad: 6000 });
   */
  update(id: string, updateData: UpdateEvent): Promise<Event | null> {
    const eventIndex = this.events.findIndex((event) => event.id === id);

    if (eventIndex === -1) {
      return Promise.resolve(null);
    }

    const existingEvent = this.events[eventIndex];
    if (!existingEvent) {
      return Promise.resolve(null);
    }

    const updatedEvent: Event = {
      ...existingEvent,
      ...updateData,
    };

    this.events[eventIndex] = updatedEvent;
    return Promise.resolve(updatedEvent);
  }

  /**
   * Deletes an event by its ID
   * @param {string} id - UUID of the event to delete
   * @returns {Promise<boolean>} Promise resolving to true if deleted, false if not found
   * @example
   * const deleted = await repository.delete('123e4567-e89b-12d3-a456-426614174000');
   */
  delete(id: string): Promise<boolean> {
    const eventIndex = this.events.findIndex((event) => event.id === id);

    if (eventIndex === -1) {
      return Promise.resolve(false);
    }

    this.events.splice(eventIndex, 1);
    return Promise.resolve(true);
  }
}

/**
 * Singleton instance of EventRepository for application use
 * @type {EventRepository}
 */
export const eventRepository = new EventRepository();
