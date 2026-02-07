import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const adminGuard = () => {
  const router = inject(Router);

  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;

  if (user && user.role === 'admin') {
    return true;
  }

  console.warn("⛔ Accès refusé : Vous n'êtes pas administrateur.");
  router.navigate(['/stocks']);
  return false;
};
