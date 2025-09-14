import { Event, CreateEvent, UpdateEvent, EventQuery } from './event.schema';
import { v4 as uuidv4 } from 'uuid';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EventRepository {
  private events: Event[] = [];

  async create(eventData: CreateEvent): Promise<Event> {
    const event: Event = {
      id: uuidv4(),
      ...eventData,
    };

    this.events.push(event);
    return event;
  }

  async findAll(query?: EventQuery): Promise<PaginatedResult<Event>> {
    let filteredEvents = [...this.events];

    if (query?.tipo) {
      filteredEvents = filteredEvents.filter(event => event.tipo === query.tipo);
    }

    const total = filteredEvents.length;
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const offset = (page - 1) * limit;

    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      data: paginatedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Event | null> {
    const event = this.events.find(event => event.id === id);
    return event || null;
  }

  async update(id: string, updateData: UpdateEvent): Promise<Event | null> {
    const eventIndex = this.events.findIndex(event => event.id === id);

    if (eventIndex === -1) {
      return null;
    }

    const updatedEvent: Event = {
      ...this.events[eventIndex],
      ...updateData,
    };

    this.events[eventIndex] = updatedEvent;
    return updatedEvent;
  }

  async delete(id: string): Promise<boolean> {
    const eventIndex = this.events.findIndex(event => event.id === id);

    if (eventIndex === -1) {
      return false;
    }

    this.events.splice(eventIndex, 1);
    return true;
  }
}

export const eventRepository = new EventRepository();