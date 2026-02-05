import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const userJson = localStorage.getItem('currentUser');

    if (!userJson) {
      // Si pas d'utilisateur, redirection immédiate
      this.router.navigate(['/login']);
    } else {
      // On récupère le nom pour l'afficher
      const user = JSON.parse(userJson);
      this.userName = user.username;
    }
  }

  logout() {
    localStorage.removeItem('currentUser'); // On vide la mémoire
    this.router.navigate(['/login']); // Retour à la case départ
  }
}
