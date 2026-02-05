import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import important pour les boucles
import { ApiService } from './services/api';
import { Login } from './login/login';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  showNavbar: boolean = true;
  isMenuCollapsed: boolean = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Liste des pages SANS barre de navigation
        const hideOnPages = ['/login', '/inscription', '/'];
        this.showNavbar = !hideOnPages.includes(event.url);
      });
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  get isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.role === 'admin';
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}
