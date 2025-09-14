import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';
import {
  CreateEventSchema,
  UpdateEventSchema,
  EventQuerySchema,
} from './event.schema';

export class EventController {
  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = CreateEventSchema.parse(req.body);
      const event = await eventService.createEvent(validatedData);

      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  }

  async getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = EventQuerySchema.parse(req.query);
      const result = await eventService.getAllEvents(validatedQuery);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const event = await eventService.getEventById(id);

      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = UpdateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(id, validatedData);

      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await eventService.deleteEvent(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();