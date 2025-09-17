/**
 * @fileoverview Unit tests for the event service layer
 */

import { eventService } from '../src/api/events/event.service';
import { eventRepository } from '../src/api/events/event.repository';
import { NotFoundError } from '../src/core/middleware/errorHandler';

jest.mock('../src/api/events/event.repository', () => {
  const create = jest.fn();
  const findAll = jest.fn();
  const findById = jest.fn();
  const update = jest.fn();
  const deleteFn = jest.fn();

  return {
    eventRepository: {
      create,
      findAll,
      findById,
      update,
      delete: deleteFn,
    },
  };
});

describe('EventService', () => {
  const mockedRepository = eventRepository as jest.Mocked<typeof eventRepository>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when event not found on get', async () => {
    mockedRepository.findById.mockResolvedValueOnce(null);

    await expect(eventService.getEventById('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws when update target is missing', async () => {
    mockedRepository.update.mockResolvedValueOnce(null);

    await expect(eventService.updateEvent('missing', {})).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws when delete target is missing', async () => {
    mockedRepository.delete.mockResolvedValueOnce(false);

    await expect(eventService.deleteEvent('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('delegates create and findAll to repository', async () => {
    const baseEvent = {
      id: 'id',
      nombre: 'n',
      cantidad: 1,
      fecha: new Date('2025-01-01T00:00:00.000Z'),
      tipo: 'ingreso' as const,
    };

    mockedRepository.create.mockResolvedValueOnce(baseEvent);
    mockedRepository.findAll.mockResolvedValueOnce({
      data: [],
      limit: 10,
      page: 1,
      total: 0,
      totalPages: 0,
    });

    await eventService.createEvent({
      nombre: 'n',
      cantidad: 1,
      fecha: new Date('2025-01-01T00:00:00.000Z'),
      tipo: 'ingreso',
    });
    await eventService.getAllEvents();

    expect(mockedRepository.create).toHaveBeenCalled();
    expect(mockedRepository.findAll).toHaveBeenCalled();
  });
});
