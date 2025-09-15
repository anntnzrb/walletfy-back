/**
 * @fileoverview Event management service layer for handling business logic and validation
 */

import { eventRepository, type PaginatedResult } from './event.repository';
import type {
  Event,
  CreateEvent,
  UpdateEvent,
  EventQuery,
} from './event.schema';
import { NotFoundError } from '../../core/middleware/errorHandler';

/**
 * Service class containing business logic for event management operations
 * Acts as an intermediary between controllers and repository layer
 */
export class EventService {
  /**
   * Creates a new event with validation and business rules
   * @param {CreateEvent} eventData - Event data to create (without ID)
   * @returns {Promise<Event>} Promise resolving to the created event with generated ID
   * @example
   * const event = await eventService.createEvent({
   *   nombre: 'Monthly Salary',
   *   cantidad: 5000,
   *   fecha: new Date(),
   *   tipo: 'ingreso'
   * });
   */
  async createEvent(eventData: CreateEvent): Promise<Event> {
    return await eventRepository.create(eventData);
  }

  /**
   * Retrieves all events with optional filtering and pagination
   * @param {EventQuery} [query] - Optional query parameters for filtering and pagination
   * @returns {Promise<PaginatedResult<Event>>} Promise resolving to paginated events result
   * @example
   * const events = await eventService.getAllEvents({ page: 1, limit: 10, tipo: 'ingreso' });
   */
  async getAllEvents(query?: EventQuery): Promise<PaginatedResult<Event>> {
    return await eventRepository.findAll(query);
  }

  /**
   * Retrieves a single event by its ID
   * @param {string} id - UUID of the event to retrieve
   * @returns {Promise<Event>} Promise resolving to the found event
   * @throws {NotFoundError} When event with given ID doesn't exist
   * @example
   * const event = await eventService.getEventById('123e4567-e89b-12d3-a456-426614174000');
   */
  async getEventById(id: string): Promise<Event> {
    const event = await eventRepository.findById(id);

    if (!event) {
      throw new NotFoundError('Event');
    }

    return event;
  }

  /**
   * Updates an existing event with new data
   * @param {string} id - UUID of the event to update
   * @param {UpdateEvent} updateData - Partial event data with updates
   * @returns {Promise<Event>} Promise resolving to the updated event
   * @throws {NotFoundError} When event with given ID doesn't exist
   * @example
   * const updated = await eventService.updateEvent('123e4567...', { cantidad: 6000 });
   */
  async updateEvent(id: string, updateData: UpdateEvent): Promise<Event> {
    const updatedEvent = await eventRepository.update(id, updateData);

    if (!updatedEvent) {
      throw new NotFoundError('Event');
    }

    return updatedEvent;
  }

  /**
   * Deletes an event by its ID
   * @param {string} id - UUID of the event to delete
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   * @throws {NotFoundError} When event with given ID doesn't exist
   * @example
   * await eventService.deleteEvent('123e4567-e89b-12d3-a456-426614174000');
   */
  async deleteEvent(id: string): Promise<void> {
    const deleted = await eventRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError('Event');
    }
  }
}

/**
 * Singleton instance of EventService for application use
 * @type {EventService}
 */
export const eventService = new EventService();
