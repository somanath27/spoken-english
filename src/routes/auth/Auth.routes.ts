import { Router } from 'express';
import { register, login, logout, me } from '../../controllers/auth/Auth.controller';
import { authenticate } from '@/middleware/auth/Auth.middleware';
import { Routes } from '@/interfaces';

export class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public routes
    this.router.post(`${this.path}/register`, register);
    this.router.post(`${this.path}/login`, login);
    this.router.post(`${this.path}/logout`, logout);

    // Protected routes
    this.router.get(`${this.path}/me`, authenticate, me);
  }
}

export default AuthRoute;
