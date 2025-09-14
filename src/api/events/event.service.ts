import { eventRepository } from './event.repository';
import { Event, CreateEvent, UpdateEvent, EventQuery } from './event.schema';
import { NotFoundError } from '../../core/middleware/errorHandler';

export class EventService {
  async createEvent(eventData: CreateEvent): Promise<Event> {
    return await eventRepository.create(eventData);
  }

  async getAllEvents(query?: EventQuery) {
    return await eventRepository.findAll(query);
  }

  async getEventById(id: string): Promise<Event> {
    const event = await eventRepository.findById(id);

    if (!event) {
      throw new NotFoundError('Event');
    }

    return event;
  }

  async updateEvent(id: string, updateData: UpdateEvent): Promise<Event> {
    const updatedEvent = await eventRepository.update(id, updateData);

    if (!updatedEvent) {
      throw new NotFoundError('Event');
    }

    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    const deleted = await eventRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError('Event');
    }
  }
}

export const eventService = new EventService();