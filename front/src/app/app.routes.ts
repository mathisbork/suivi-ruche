import { Routes } from '@angular/router';
import { Login } from './login/login';
import { SignUp } from './sign-up/sign-up';
import { Home } from './home/home';
import { Miellerie } from './pages/miellerie/miellerie';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'inscription', component: SignUp },
  { path: 'home', component: Home },
  { path: 'stocks', component: Miellerie },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
