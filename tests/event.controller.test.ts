/**
 * @fileoverview Unit tests for the event controller helpers
 */

import type { Request, Response, NextFunction } from 'express';
import { EventController } from '../src/api/events/event.controller';
import { eventService } from '../src/api/events/event.service';

jest.mock('../src/api/events/event.service', () => ({
  eventService: {
    createEvent: jest.fn(),
    getAllEvents: jest.fn(),
    getEventById: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  },
}));

describe('EventController helpers', () => {
  const controller = new EventController();
  const mockedService = eventService as jest.Mocked<typeof eventService>;

  const createResponse = () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    return res;
  };

  const noopNext: NextFunction = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('responds with 400 when id is missing', async () => {
    const req = {
      params: {},
    } as unknown as Request;
    const res = createResponse();

    await controller.getEventById(req, res, noopNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event ID is required' });
    expect(mockedService.getEventById).not.toHaveBeenCalled();
  });

  it('delegates to service when id is present', async () => {
    mockedService.getEventById.mockResolvedValueOnce({} as never);

    const req = {
      params: { id: 'abc' },
    } as unknown as Request;
    const res = createResponse();

    await controller.getEventById(req, res, noopNext);

    expect(mockedService.getEventById).toHaveBeenCalledWith('abc');
  });

  it('forwards errors to next via execute helper', async () => {
    const error = new Error('boom');
    mockedService.createEvent.mockRejectedValueOnce(error);

    const req = {
      body: {
        nombre: 'Sample',
        cantidad: 10,
        fecha: new Date('2025-01-01T00:00:00.000Z'),
        tipo: 'ingreso',
      },
    } as Request;
    const res = createResponse();
    const next = jest.fn();

    await controller.createEvent(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
