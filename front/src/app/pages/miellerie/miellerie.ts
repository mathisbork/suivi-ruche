import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-miellerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './miellerie.html',
  styleUrl: './miellerie.scss',
})
export class Miellerie implements OnInit, OnDestroy {
  stocks: any[] = [];
  isModalOpen = false;
  private refreshTimer: any; // Pour stocker le timer

  nouveauStock = {
    type_miel: 'Printemps',
    annee: new Date().getFullYear(),
    poids_total: 0,
    pots_500g: 0,
    pots_250g: 0,
    prix_kg: 0,
  };

  // On injecte ChangeDetectorRef comme dans ton autre projet
  constructor(
    private apiService: ApiService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.chargerStocks();

    // Mise à jour automatique toutes les 5 secondes
    this.refreshTimer = setInterval(() => {
      this.chargerStocks();
    }, 5000);
  }

  ngOnDestroy() {
    // On détruit le timer quand on quitte la page pour éviter de ralentir le PC/tel
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  chargerStocks() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.id) {
      this.apiService.getStocks(user.id).subscribe({
        next: (data: any) => {
          this.stocks = data;
          this.cd.detectChanges(); // Force Angular à rafraîchir l'écran
        },
        error: (err: any) => console.error('Erreur:', err),
      });
    }
  }

  // Fonction pour calculer le poids en fonction des pots
  calculerPoidsAuto() {
    this.nouveauStock.poids_total =
      this.nouveauStock.pots_500g * 0.5 + this.nouveauStock.pots_250g * 0.25;
  }

  ajouterRecolte() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const data = { ...this.nouveauStock, user_id: user.id };

    this.apiService.addStock(data).subscribe({
      next: () => {
        console.log('Récolte ajoutée avec succès !');
        this.chargerStocks();
        // On remet le formulaire à zéro pour la prochaine fois
        this.nouveauStock = {
          type_miel: 'Printemps',
          annee: 2026,
          poids_total: 0,
          pots_500g: 0,
          pots_250g: 0,
          prix_kg: 0,
        };
      },
      error: (err) => console.error("Erreur d'ajout :", err),
    });
  }

  supprimerStock(id: number) {
    if (confirm('Es-tu sûr de vouloir supprimer cette récolte ?')) {
      (this.apiService as any).deleteStock(id).subscribe({
        next: () => {
          this.chargerStocks(); // On rafraîchit la liste après suppression
        },
        error: (err: any) => console.error('Erreur lors de la suppression :', err),
      });
    }
  }
}
