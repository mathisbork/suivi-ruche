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
  mesCommandes: any[] = [];

  // AJOUT : On garde une copie locale du panier pour vérifier les quantités
  currentCartItems: any[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  idToDelete: number | null = null;

  cartCount = 0;
  cartAmount = 0;

  refreshInterval: any;
  isAdmin = false;

  stockTotalKg = 0;
  totalPots = 0;
  valeurTotale = 0;

  notificationMessage = '';
  isError = false;

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

    if (!this.isAdmin) {
      this.chargerMesCommandes();
    }

    this.refreshInterval = setInterval(() => {
      this.chargerStocks();
      if (!this.isAdmin) {
        this.chargerMesCommandes();
      }
    }, 2000);

    // MODIFICATION : On stocke les items du panier dans currentCartItems
    this.cartService.cart$.subscribe((items) => {
      this.currentCartItems = items; // <--- C'est ça qui nous permet de vérifier
      this.cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
      this.cartAmount = this.cartService.getTotal();
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  chargerMesCommandes() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.id) {
      this.api.getUserOrders(user.id).subscribe({
        next: (data: any) => {
          this.mesCommandes = data;
        },
        error: (e) => console.error(e),
      });
    }
  }

  getStatusColor(statut: string): string {
    const s = (statut || '').toLowerCase();
    if (s === 'payée' || s === 'payee') return 'success';
    if (s === 'validée' || s === 'validee') return 'primary';
    if (s === 'annulée' || s === 'annulee') return 'danger';
    return 'warning';
  }

  // --- C'EST ICI QUE LA MAGIE OPÈRE (Vérification du stock) ---
  commander(stock: any, typePot: string) {
    // 1. Quel est le stock max pour ce pot ?
    const maxStock = typePot === '500g' ? stock.pots_500g : stock.pots_250g;

    // 2. Combien en a-t-on DÉJÀ dans le panier ?
    const itemInCart = this.currentCartItems.find(
      (i) => i.id === stock.id && i.type_pot === typePot,
    );
    const qtyInCart = itemInCart ? itemInCart.quantity : 0;

    // 3. Vérification
    if (qtyInCart + 1 > maxStock) {
      this.afficherNotif(`❌ Stock insuffisant ! Vous avez déjà tout pris.`, true);
      return; // On arrête tout, on n'ajoute pas au panier
    }

    // 4. Si c'est bon, on ajoute
    this.cartService.addToCart(stock, typePot);
    this.afficherNotif(`🛒 ${stock.type_miel} (${typePot}) ajouté au panier !`);
  }

  // ... (Le reste du fichier ne change pas : afficherNotif, checkRole, chargerStocks, modals, admin functions) ...

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

  chargerStocks() {
    const sellerId = 1;
    this.api.getStocks(sellerId).subscribe({
      next: (data: any) => {
        this.stocks = data;

        // --- CORRECTION : ON RECALCULE TOUT EN LIVE ---

        // 1. Calcul du poids total basé sur les pots restants (et pas sur la colonne poids_total de la BDD qui est obsolète)
        this.stockTotalKg = this.stocks.reduce((acc, s) => {
          const poidsReel = s.pots_500g * 0.5 + s.pots_250g * 0.25;
          return acc + poidsReel;
        }, 0);

        // 2. Calcul du nombre total de pots
        this.totalPots = this.stocks.reduce((acc, s) => acc + s.pots_500g + s.pots_250g, 0);

        // 3. Calcul de la valeur totale (Poids réel * Prix au kg)
        this.valeurTotale = this.stocks.reduce((acc, s) => {
          const poidsReel = s.pots_500g * 0.5 + s.pots_250g * 0.25;
          return acc + poidsReel * s.prix_kg;
        }, 0);

        this.cd.detectChanges();
      },
      error: (e) => console.error(e),
    });
  }

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
      .updateStock(stock.id, { pots_500g: p500, pots_250g: p250, poids_total: nouveauPoids })
      .subscribe({
        next: () => {
          this.chargerStocks();
          this.afficherNotif(`✅ 1 pot de ${grammage}g retiré !`);
        },
        error: () => this.afficherNotif('❌ Erreur réseau', true),
      });
  }
}
