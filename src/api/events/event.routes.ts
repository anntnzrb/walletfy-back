import { Router } from 'express';
import { eventController } from './event.controller';

const router = Router();

router.post('/eventos', eventController.createEvent.bind(eventController));

router.get('/eventos', eventController.getAllEvents.bind(eventController));

router.get('/eventos/:id', eventController.getEventById.bind(eventController));

router.put('/eventos/:id', eventController.updateEvent.bind(eventController));

router.delete('/eventos/:id', eventController.deleteEvent.bind(eventController));

export default router;