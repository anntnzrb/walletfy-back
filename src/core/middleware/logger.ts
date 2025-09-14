import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const query = req.query;

  console.log(`[${timestamp}] ${method} ${url} - Query:`, JSON.stringify(query));

  next();
};