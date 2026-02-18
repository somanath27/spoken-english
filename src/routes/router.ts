import { Routes } from '@/interfaces';
import AuthRoute from './auth/Auth.routes';

const routes: Routes[] = [
  new AuthRoute()
];

export default routes;
