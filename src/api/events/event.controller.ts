/**
 * @fileoverview Event controller layer for handling HTTP requests and responses
 */

import type { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventQuerySchema,
} from './event.schema';

/**
 * Controller class handling HTTP requests for event management endpoints
 * Validates request data and delegates business logic to the service layer
 */
export class EventController {
  /**
   * Wraps controller logic with shared try/catch forwarding to Express next()
   */
  private async execute(
    next: NextFunction,
    action: () => Promise<void>,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validates the presence of `req.params.id` before executing the provided action.
   * Sends a 400 response when the identifier is missing.
   */
  private async withEventId(
    req: Request,
    res: Response,
    next: NextFunction,
    action: (id: string) => Promise<void>,
  ): Promise<void> {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Event ID is required' });
      return;
    }

    await this.execute(next, async () => {
      await action(id);
    });
  }

  /**
   * Creates a new event from HTTP POST request
   * @param {Request} req - Express request object containing event data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * @example
   * POST /eventos
   * Body: { "nombre": "Salary", "cantidad": 5000, "fecha": "2023-01-01", "tipo": "ingreso" }
   * Response: 201 with created event object
   */
  async createEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    await this.execute(next, async () => {
      const validatedData = CreateEventSchema.parse(req.body);
      const event = await eventService.createEvent(validatedData);

      res.status(201).json(event);
    });
  }

  /**
   * Retrieves all events with optional filtering and pagination from HTTP GET request
   * @param {Request} req - Express request object with optional query parameters
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * @example
   * GET /eventos?page=1&limit=10&tipo=ingreso
   * Response: 200 with paginated events result
   */
  async getAllEvents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    await this.execute(next, async () => {
      const validatedQuery = EventQuerySchema.parse(req.query);
      const result = await eventService.getAllEvents(validatedQuery);

      res.status(200).json(result);
    });
  }

  /**
   * Retrieves a single event by ID from HTTP GET request
   * @param {Request} req - Express request object with event ID in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * @example
   * GET /eventos/123e4567-e89b-12d3-a456-426614174000
   * Response: 200 with event object or 404 if not found
   */
  async getEventById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    await this.withEventId(req, res, next, async (id) => {
      const event = await eventService.getEventById(id);

      res.status(200).json(event);
    });
  }

  /**
   * Updates an existing event from HTTP PUT request
   * @param {Request} req - Express request object with event ID in params and update data in body
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * @example
   * PUT /eventos/123e4567-e89b-12d3-a456-426614174000
   * Body: { "cantidad": 6000 }
   * Response: 200 with updated event object or 404 if not found
   */
  async updateEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    await this.withEventId(req, res, next, async (id) => {
      const validatedData = UpdateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(id, validatedData);

      res.status(200).json(event);
    });
  }

  /**
   * Deletes an event from HTTP DELETE request
   * @param {Request} req - Express request object with event ID in params
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function for error handling
   * @returns {Promise<void>} Promise that resolves when response is sent
   * @example
   * DELETE /eventos/123e4567-e89b-12d3-a456-426614174000
   * Response: 204 with no content or 404 if not found
   */
  async deleteEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    await this.withEventId(req, res, next, async (id) => {
      await eventService.deleteEvent(id);

      res.status(204).send();
    });
  }
}

/**
 * Singleton instance of EventController for application use
 * @type {EventController}
 */
export const eventController = new EventController();
