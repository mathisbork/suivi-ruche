import { Routes } from '@angular/router';
import { Login } from './login/login';
import { SignUp } from './sign-up/sign-up';
import { Home } from './home/home';
import { Miellerie } from './pages/miellerie/miellerie';
import { Cart } from './cart/cart';
import { AdminOrders } from './admin-orders/admin-orders';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'inscription', component: SignUp },
  { path: 'home', component: Home },
  { path: 'stocks', component: Miellerie },
  { path: 'panier', component: Cart },
  {
    path: 'commandes',
    component: AdminOrders,
    canActivate: [adminGuard],
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
