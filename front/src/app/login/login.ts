import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  userForm = { email: '', password: '' };
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  onLogin() {
    this.errorMessage = '';

    this.apiService.login(this.userForm).subscribe({
      next: (res: any) => {
        localStorage.setItem('currentUser', JSON.stringify(res.user));

        this.router.navigate(['/stocks']);
      },
      error: (err) => {
        this.errorMessage = 'Email ou mot de passe incorrect';
        console.error(err);
      },
    });
  }
}
