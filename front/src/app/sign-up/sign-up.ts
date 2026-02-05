import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../models/user.model';
import { ApiService } from '../services/api';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  userForm: User = { username: '', email: '', password: '' };

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  onSubmit() {
    this.apiService.register(this.userForm).subscribe({
      next: (res) => {
        alert('Compte créé avec succès !');
        this.router.navigate(['/login']); // Redirection après succès
      },
      error: (err) => console.error('Erreur inscription:', err),
    });
  }
}
