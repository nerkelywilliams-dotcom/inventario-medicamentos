import { Request, Response } from "express";

export function registerRoutes(app: any) {
  // API routes - minimal implementation for build
  app.get('/api/user', (req: Request, res: Response) => {
    res.json({ message: 'User endpoint' });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    res.json({ message: 'Login endpoint' });
  });

  app.get('/api/families', (req: Request, res: Response) => {
    res.json([]);
  });

  app.get('/api/medications', (req: Request, res: Response) => {
    res.json([]);
  });

  app.get('/api/logs', (req: Request, res: Response) => {
    res.json([]);
  });

  app.post('/api/inventory/chat', (req: Request, res: Response) => {
    res.json({ answer: 'Chat endpoint' });
  });

  app.get('/api/inventory/stats', (req: Request, res: Response) => {
    res.json({ totalProducts: 0, lowStock: 0, outOfStock: 0, totalItems: 0 });
  });

  app.post('/api/medications/import', (req: Request, res: Response) => {
    res.json({ message: 'Import endpoint' });
  });
}