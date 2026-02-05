import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-miellerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './miellerie.html',
  styleUrls: ['./miellerie.scss'],
})
export class Miellerie implements OnInit, OnDestroy {
  stocks: any[] = [];
  isModalOpen = false;
  refreshInterval: any;
  isAdmin = false;

  stockTotalKg = 0;
  totalPots = 0;
  valeurTotale = 0;

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
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.checkRole();
    this.chargerStocks();
    this.refreshInterval = setInterval(() => this.chargerStocks(), 2000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
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

        this.stockTotalKg = this.stocks.reduce((acc, s) => acc + Number(s.poids_total), 0);
        this.totalPots = this.stocks.reduce((acc, s) => acc + s.pots_500g + s.pots_250g, 0);
        this.valeurTotale = this.stocks.reduce((acc, s) => acc + s.poids_total * s.prix_kg, 0);

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
      },
      error: () => alert('Erreur ajout'),
    });
  }

  supprimerStock(id: number) {
    if (this.isAdmin && confirm('Supprimer ?')) {
      this.api.deleteStock(id).subscribe(() => this.chargerStocks());
    }
  }

  commander(stock: any) {
    alert(`🛒 Ajouté au panier : ${stock.type_miel}`);
  }

  retirerPots(stock: any, grammage: number) {
    const input = prompt(`Combien de pots de ${grammage}g veux-tu retirer ?`);
    if (!input) return;

    const qteRetiree = parseInt(input);
    if (isNaN(qteRetiree) || qteRetiree <= 0) {
      alert('Chiffre invalide !');
      return;
    }

    let p500 = stock.pots_500g;
    let p250 = stock.pots_250g;

    if (grammage === 500) {
      if (qteRetiree > p500) {
        alert("Tu n'as pas assez de pots !");
        return;
      }
      p500 = p500 - qteRetiree;
    } else {
      if (qteRetiree > p250) {
        alert("Tu n'as pas assez de pots !");
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
          alert(`✅ ${qteRetiree} pots retirés du stock (Cadeau/Conso)`);
        },
        error: () => alert('Erreur lors de la mise à jour'),
      });
  }
}
