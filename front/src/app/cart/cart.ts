import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart';
import { ApiService } from '../services/api';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal'; // Vérifie le chemin

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss'],
  providers: [ApiService],
})
export class Cart implements OnInit {
  cartItems: any[] = [];
  total = 0;

  // --- CONFIGURATION DE LA MODAL ---
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'warning' | 'danger' | 'success' = 'warning';
  modalButtonText = 'Valider';

  // Cette variable sert à savoir ce qu'on fait quand on clique sur le bouton de la modal
  currentAction: 'CONFIRM_ORDER' | 'GO_LOGIN' | 'GO_HOME' | 'CLOSE' = 'CLOSE';

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  supprimer(id: number) {
    this.cartService.removeFromCart(id);
  }

  // --- ÉTAPE 1 : QUAND ON CLIQUE SUR "VALIDER MA COMMANDE" ---
  demanderValidation() {
    if (this.cartItems.length === 0) return;

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // CAS 1 : Pas connecté -> Modal Rouge qui renvoie vers Login
    if (!user.id) {
      this.setupModal(
        'Connexion requise',
        'Vous devez être connecté pour valider votre panier.',
        'danger',
        'Se connecter',
        'GO_LOGIN',
      );
      return;
    }

    // CAS 2 : Tout est bon -> Modal Jaune pour confirmer le paiement
    this.setupModal(
      'Confirmer la commande',
      `Le montant total est de ${this.total.toFixed(2)} €. Voulez-vous continuer ?`,
      'warning',
      'Payer et Commander',
      'CONFIRM_ORDER',
    );
  }

  // --- ÉTAPE 2 : QUAND L'UTILISATEUR CLIQUE SUR LE BOUTON DE LA MODAL ---
  onModalConfirm() {
    this.isModalOpen = false; // On ferme d'abord

    if (this.currentAction === 'GO_LOGIN') {
      this.router.navigate(['/login']);
    } else if (this.currentAction === 'GO_HOME') {
      this.router.navigate(['/stocks']);
    } else if (this.currentAction === 'CONFIRM_ORDER') {
      this.lancerLaCommande(); // On lance la vraie requête API
    }
    // Si c'est 'CLOSE', on ne fait rien de plus, la fenêtre est déjà fermée
  }

  // --- LA LOGIQUE API ---
  // Dans cart.ts

  lancerLaCommande() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const commandeData = {
      user_id: user.id,
      clientEmail: user.email,
      items: this.cartItems,
      total: this.total,
      date: new Date(),
    };

    // On envoie la requête au serveur
    this.api.saveOrder(commandeData).subscribe({
      // ✅ SCÉNARIO SUCCÈS (Le serveur a répondu 200 OK)
      next: () => {
        // 1. C'est ICI qu'on vide le panier (LocalStorage + Variable)
        this.cartService.clearCart();
        this.isModalOpen = false;
        this.router.navigate(['/stocks']);

        // 2. On affiche la modal de succès
        this.setupModal(
          'Merci ! 🐝',
          'Votre commande a été validée avec succès.',
          'success',
          'Retour aux stocks',
          'GO_HOME',
        );
      },

      // ❌ SCÉNARIO ÉCHEC (Le serveur a répondu 400, 404, 500...)
      error: (err: any) => {
        console.error(err);

        this.setupModal(
          'Oups !',
          'Une erreur est survenue. Vérifiez votre connexion.',
          'danger',
          'Fermer',
          'CLOSE',
        );
      },
    });
  }

  // --- PETITE FONCTION UTILITAIRE POUR CONFIGURER LA MODAL RAPIDEMENT ---
  setupModal(title: string, msg: string, type: any, btnText: string, action: any) {
    this.modalTitle = title;
    this.modalMessage = msg;
    this.modalType = type;
    this.modalButtonText = btnText;
    this.currentAction = action;
    this.isModalOpen = true;
  }
}
