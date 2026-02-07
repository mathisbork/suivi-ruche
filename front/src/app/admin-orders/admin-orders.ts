import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, ConfirmModalComponent, RouterLink],
  templateUrl: './admin-orders.html',
})
export class AdminOrders implements OnInit, OnDestroy {
  // ON REMPLACE LA LISTE UNIQUE PAR 3 LISTES
  commandesEnAttente: any[] = [];
  commandesValidees: any[] = [];
  commandesTerminees: any[] = [];

  refreshInterval: any;

  // Modale
  isModalOpen = false;
  orderIdToCancel: number | null = null;

  constructor(
    private api: ApiService,
    private cd: ChangeDetectorRef, 
  ) {}

  ngOnInit() {
    this.chargerCommandes();

    // Actualisation toutes les 2 secondes
    this.refreshInterval = setInterval(() => {
      this.chargerCommandes();
    }, 2000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  chargerCommandes() {
    this.api.getAllOrders().subscribe({
      // CORRECTION ICI : on met 'any' au lieu de 'any[]' pour éviter l'erreur de type
      next: (data: any) => {
        // FILTRAGE DES COMMANDES
        // Comme data est 'any', on peut utiliser .filter() sans que TypeScript ne râle
        this.commandesEnAttente = data.filter((c: any) => c.statut === 'En attente');
        this.commandesValidees = data.filter((c: any) => c.statut === 'Validée');
        this.commandesTerminees = data.filter((c: any) => c.statut === 'Payée' || c.statut === 'Annulée');

        this.cd.detectChanges(); // Force la mise à jour
      },
      error: (e) => console.error('Erreur chargement commandes:', e),
    });
  }

  // --- ACTIONS ---

  passerEtapeSuivante(commande: any) {
    let nouveauStatut = '';

    if (commande.statut === 'En attente') {
      nouveauStatut = 'Validée';
    } else if (commande.statut === 'Validée') {
      nouveauStatut = 'Payée';
    } else {
      return;
    }

    this.api.updateOrderStatus(commande.id_commande, nouveauStatut).subscribe(() => {
      this.chargerCommandes();
    });
  }

  // --- ANNULATION ---

  demanderAnnulation(id: number) {
    this.orderIdToCancel = id;
    this.isModalOpen = true;
  }

  confirmerAnnulation() {
    if (this.orderIdToCancel) {
      this.api.updateOrderStatus(this.orderIdToCancel, 'Annulée').subscribe(() => {
        this.chargerCommandes();
        this.isModalOpen = false;
        this.orderIdToCancel = null;
      });
    }
  }

  // --- DESIGN ---

  getStatusColor(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s === 'payée') return 'success';
    if (s === 'validée') return 'primary';
    if (s === 'annulée') return 'danger';
    return 'warning';
  }
}