import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // On récupère le panier sauvegardé au démarrage
  private cartItems = new BehaviorSubject<any[]>(this.getSavedCart());
  cart$ = this.cartItems.asObservable();

  constructor() {}

  private getSavedCart(): any[] {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  }

  // --- AJOUTER AU PANIER (Modifié pour gérer 500g vs 250g) ---
  addToCart(product: any, typePot: string) {
    const currentCart = this.cartItems.value;

    // On vérifie si ce produit existe déjà avec le MÊME ID et le MÊME TYPE DE POT
    const existingItem = currentCart.find(
      (item) => item.id === product.id && item.type_pot === typePot,
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      // Calcul du prix unitaire selon la taille
      let prixUnitaire = 0;
      if (typePot === '500g') {
        prixUnitaire = product.prix_kg * 0.5;
      } else {
        // 250g
        prixUnitaire = product.prix_kg * 0.25;
      }

      // On ajoute le produit avec ses infos spécifiques
      currentCart.push({
        ...product,
        quantity: 1,
        type_pot: typePot,
        prix_unitaire: prixUnitaire,
      });
    }

    this.updateCart(currentCart);
  }

  // Supprimer un produit
  removeFromCart(productId: number) {
    // Note : Cela retire toutes les variantes de ce produit (500g et 250g) car on filtre par ID
    const currentCart = this.cartItems.value.filter((item) => item.id !== productId);
    this.updateCart(currentCart);
  }

  // Vider tout le panier
  clearCart() {
    this.updateCart([]);
  }

  // Mettre à jour les données et le localStorage
  private updateCart(items: any[]) {
    this.cartItems.next(items);
    localStorage.setItem('cart', JSON.stringify(items));
  }

  // --- CALCUL DU TOTAL (Modifié pour utiliser le prix_unitaire) ---
  getTotal(): number {
    return this.cartItems.value.reduce((total, item) => {
      // On multiplie la quantité par le prix unitaire (qui vaut soit le prix 500g, soit 250g)
      return total + item.prix_unitaire * item.quantity;
    }, 0);
  }
}
