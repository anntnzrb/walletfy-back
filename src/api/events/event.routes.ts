/**
 * @fileoverview Event API routes configuration using Express Router
 */

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { eventController } from './event.controller';

/**
 * Wraps async route handlers to handle promise rejections
 */
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
};

/**
 * Express router instance for event-related API endpoints
 * @type {Router}
 */
const router = Router();

/**
 * POST /eventos - Create a new event
 * @route POST /eventos
 * @description Creates a new financial event with validation
 * @param {Object} req.body - Event data (nombre, cantidad, fecha, tipo, descripcion?, adjunto?)
 * @returns {Object} 201 - Created event object with generated ID
 * @returns {Object} 400 - Validation error
 */
router.post(
  '/eventos',
  asyncHandler(async (req, res, next) => {
    await eventController.createEvent(req, res, next);
  }),
);

/**
 * GET /eventos - Retrieve all events with optional filtering and pagination
 * @route GET /eventos
 * @description Retrieves events with optional query parameters for filtering and pagination
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=10] - Number of items per page (max 100)
 * @param {string} [req.query.tipo] - Filter by event type ('ingreso' or 'egreso')
 * @returns {Object} 200 - Paginated events result with metadata
 * @returns {Object} 400 - Validation error
 */
router.get(
  '/eventos',
  asyncHandler(async (req, res, next) => {
    await eventController.getAllEvents(req, res, next);
  }),
);

/**
 * GET /eventos/:id - Retrieve a specific event by ID
 * @route GET /eventos/:id
 * @description Retrieves a single event by its unique UUID
 * @param {string} req.params.id - UUID of the event to retrieve
 * @returns {Object} 200 - Event object
 * @returns {Object} 404 - Event not found
 */
router.get(
  '/eventos/:id',
  asyncHandler(async (req, res, next) => {
    await eventController.getEventById(req, res, next);
  }),
);

/**
 * PUT /eventos/:id - Update an existing event
 * @route PUT /eventos/:id
 * @description Updates an existing event with partial data
 * @param {string} req.params.id - UUID of the event to update
 * @param {Object} req.body - Partial event data to update
 * @returns {Object} 200 - Updated event object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 404 - Event not found
 */
router.put(
  '/eventos/:id',
  asyncHandler(async (req, res, next) => {
    await eventController.updateEvent(req, res, next);
  }),
);

/**
 * DELETE /eventos/:id - Delete an event
 * @route DELETE /eventos/:id
 * @description Deletes an event by its unique UUID
 * @param {string} req.params.id - UUID of the event to delete
 * @returns {void} 204 - No content, deletion successful
 * @returns {Object} 404 - Event not found
 */
router.delete(
  '/eventos/:id',
  asyncHandler(async (req, res, next) => {
    await eventController.deleteEvent(req, res, next);
  }),
);

/**
 * Export the configured router for use in the main application
 * @type {Router}
 */
export default router;
