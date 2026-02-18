import { Router } from 'express';
import { register, login, logout, me, forgotPasswordHandler, resetPasswordHandler, changePasswordHandler } from '../../controllers/auth/Auth.controller';
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
    this.router.post(`${this.path}/forgot-password`, forgotPasswordHandler);
    this.router.post(`${this.path}/reset-password`, resetPasswordHandler);

    // Protected routes
    this.router.get(`${this.path}/me`, authenticate, me);
    this.router.post(`${this.path}/change-password`, authenticate, changePasswordHandler);
  }
}

export default AuthRoute;
