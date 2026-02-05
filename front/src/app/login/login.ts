import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  userForm = { email: '', password: '' };

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  onLogin() {
    this.apiService.login(this.userForm).subscribe({
      next: (res: any) => {
        alert('Connexion réussie !');
        // On stocke l'utilisateur ou le message de succès et on change de page
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        this.router.navigate(['/home']);
      },
      error: (err) => {
        alert('Erreur : Email ou mot de passe incorrect');
        console.error(err);
      },
    });
  }
}
