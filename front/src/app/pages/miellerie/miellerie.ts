import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-miellerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './miellerie.html',
  styleUrls: ['./miellerie.scss'],
})
export class Miellerie implements OnInit, OnDestroy {
  stocks: any[] = [];
  mesCommandes: any[] = []; // Liste des commandes du client connecté

  // --- MODALS ---
  isModalOpen = false; // Pour l'ajout de stock
  isDeleteModalOpen = false; // Pour la suppression
  idToDelete: number | null = null;

  // --- HEADER PANIER ---
  cartCount = 0;
  cartAmount = 0;

  // --- VARIABLES ---
  refreshInterval: any;
  isAdmin = false;

  // Totaux pour l'admin
  stockTotalKg = 0;
  totalPots = 0;
  valeurTotale = 0;

  // Notifications
  notificationMessage = '';
  isError = false;

  // Formulaire d'ajout
  nouveauStock = {
    type_miel: 'Printemps',
    annee: 2026,
    poids_total: 0,
    pots_500g: 0,
    pots_250g: 0,
    prix_kg: 0,
  };

  constructor(
    private api: ApiService,
    private cartService: CartService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.checkRole();
    this.chargerStocks();

    // Si c'est un client, on charge ses commandes tout de suite
    if (!this.isAdmin) {
      this.chargerMesCommandes();
    }

    // --- AUTO-REFRESH (STOCKS + COMMANDES) ---
    // On rafraîchit les données toutes les 2 secondes
    this.refreshInterval = setInterval(() => {
      this.chargerStocks();
      if (!this.isAdmin) {
        this.chargerMesCommandes();
      }
    }, 2000);

    // --- ABONNEMENT AU PANIER ---
    // Met à jour le header (compteur et prix) dès que le panier change
    this.cartService.cart$.subscribe((items) => {
      this.cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
      this.cartAmount = this.cartService.getTotal();
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // --- GESTION DES COMMANDES CLIENT (HISTORIQUE) ---

  chargerMesCommandes() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.id) {
      this.api.getUserOrders(user.id).subscribe({
        next: (data: any) => {
          this.mesCommandes = data;
        },
        error: (e) => console.error(e), // Erreur silencieuse pour ne pas spammer
      });
    }
  }

  // Définit la couleur du badge selon le statut
  getStatusColor(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s === 'payée' || s === 'payee') return 'success'; // Vert
    if (s === 'validée' || s === 'validee') return 'primary'; // Bleu
    if (s === 'annulée' || s === 'annulee') return 'danger'; // Rouge
    return 'warning'; // Jaune (En attente) par défaut
  }

  // --- GESTION DU PANIER (AJOUT) ---

  // C'EST ICI QUE ÇA A CHANGÉ : On prend en compte le type de pot (500g ou 250g)
  commander(stock: any, typePot: string) {
    this.cartService.addToCart(stock, typePot);
    this.afficherNotif(`🛒 ${stock.type_miel} (${typePot}) ajouté au panier !`);
  }

  // --- FONCTIONS UTILITAIRES ---

  afficherNotif(message: string, erreur: boolean = false) {
    this.notificationMessage = message;
    this.isError = erreur;
    setTimeout(() => {
      this.notificationMessage = '';
    }, 3000);
  }

  checkRole() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.isAdmin = user.role === 'admin';
  }

  // --- GESTION DES STOCKS (ADMIN) ---

  chargerStocks() {
    const sellerId = 1;
    this.api.getStocks(sellerId).subscribe({
      next: (data: any) => {
        this.stocks = data;
        // Calculs des totaux pour l'affichage admin
        this.stockTotalKg = this.stocks.reduce((acc, s) => acc + Number(s.poids_total), 0);
        this.totalPots = this.stocks.reduce((acc, s) => acc + s.pots_500g + s.pots_250g, 0);
        this.valeurTotale = this.stocks.reduce((acc, s) => acc + s.poids_total * s.prix_kg, 0);
        this.cd.detectChanges();
      },
      error: (e) => console.error(e),
    });
  }

  // Gestion de la modal d'ajout
  openModal() {
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }

  calculerPoidsAuto() {
    const p500 = Number(this.nouveauStock.pots_500g) || 0;
    const p250 = Number(this.nouveauStock.pots_250g) || 0;
    this.nouveauStock.poids_total = p500 * 0.5 + p250 * 0.25;
  }

  ajouterRecolte() {
    if (!this.isAdmin) return;
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const dataToSend = { ...this.nouveauStock, user_id: user.id || 1 };

    this.api.addStock(dataToSend).subscribe({
      next: () => {
        this.chargerStocks();
        this.closeModal();
        // Reset du formulaire
        this.nouveauStock = {
          type_miel: 'Printemps',
          annee: 2026,
          poids_total: 0,
          pots_500g: 0,
          pots_250g: 0,
          prix_kg: 0,
        };
        this.afficherNotif('✅ Récolte ajoutée avec succès !');
      },
      error: () => this.afficherNotif("❌ Erreur lors de l'ajout", true),
    });
  }

  // Gestion de la suppression (avec Modal Confirm)
  supprimerStock(id: number) {
    if (!this.isAdmin) return;
    this.idToDelete = id;
    this.isDeleteModalOpen = true;
  }

  confirmerSuppression() {
    if (this.idToDelete !== null) {
      this.api.deleteStock(this.idToDelete).subscribe({
        next: () => {
          this.chargerStocks();
          this.afficherNotif('🗑️ Récolte supprimée');
          this.fermerDeleteModal();
        },
        error: () => this.afficherNotif('❌ Erreur de suppression', true),
      });
    }
  }

  fermerDeleteModal() {
    this.isDeleteModalOpen = false;
    this.idToDelete = null;
  }

  // Fonction admin pour retirer manuellement des pots (hors commande)
  retirerPots(stock: any, grammage: number) {
    const qteRetiree = 1;

    let p500 = stock.pots_500g;
    let p250 = stock.pots_250g;

    if (grammage === 500) {
      if (qteRetiree > p500) {
        this.afficherNotif('❌ Stock insuffisant !', true);
        return;
      }
      p500 = p500 - qteRetiree;
    } else {
      if (qteRetiree > p250) {
        this.afficherNotif('❌ Stock insuffisant !', true);
        return;
      }
      p250 = p250 - qteRetiree;
    }

    const nouveauPoids = p500 * 0.5 + p250 * 0.25;

    this.api
      .updateStock(stock.id, {
        pots_500g: p500,
        pots_250g: p250,
        poids_total: nouveauPoids,
      })
      .subscribe({
        next: () => {
          this.chargerStocks();
          this.afficherNotif(`✅ 1 pot de ${grammage}g retiré !`);
        },
        error: () => this.afficherNotif('❌ Erreur réseau', true),
      });
  }
}
