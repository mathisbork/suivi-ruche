import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-miellerie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './miellerie.html',
  styleUrls: ['./miellerie.scss']
})
export class Miellerie implements OnInit, OnDestroy {
  stocks: any[] = [];
  isModalOpen = false;
  refreshInterval: any;

  // L'objet qui sera envoyé au serveur
  nouveauStock = {
    type_miel: 'Printemps',
    annee: 2026,
    poids_total: 0,
    pots_500g: 0, // Correspond à ton serveur
    pots_250g: 0, // Correspond à ton serveur
    prix_kg: 0    // Correspond à ton serveur
  };

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.chargerStocks();
    // Actualisation automatique toutes les 2 secondes
    this.refreshInterval = setInterval(() => {
      this.chargerStocks();
    }, 2000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  chargerStocks() {
    // On récupère l'utilisateur connecté ou on met 1 par défaut pour tester
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = user.id || 1; 

    this.api.getStocks(userId).subscribe({
      next: (data: any) => {
        this.stocks = data;
        this.cd.detectChanges(); // Force la mise à jour du tableau
      },
      error: (e) => console.error("Erreur chargement stocks", e)
    });
  }

  // Ouvre la popup
  openModal() {
    this.isModalOpen = true;
  }
  
  // Ferme la popup
  closeModal() {
    this.isModalOpen = false;
  }

  // Calcule le poids quand tu changes le nombre de pots
  calculerPoidsAuto() {
    const p500 = Number(this.nouveauStock.pots_500g) || 0;
    const p250 = Number(this.nouveauStock.pots_250g) || 0;
    
    // 1 pot de 500g = 0.5kg
    // 1 pot de 250g = 0.25kg
    this.nouveauStock.poids_total = (p500 * 0.5) + (p250 * 0.25);
  }

  ajouterRecolte() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    // On prépare les données pour ton server.js
    const dataToSend = { 
      ...this.nouveauStock, 
      user_id: user.id || 1 
    };
    
    this.api.addStock(dataToSend).subscribe({
      next: (res) => {
        console.log("Succès:", res);
        this.chargerStocks(); // Recharge le tableau immédiatement
        this.closeModal();    // Ferme la fenêtre
        
        // Remise à zéro du formulaire
        this.nouveauStock = {
          type_miel: 'Printemps', annee: 2026, poids_total: 0,
          pots_500g: 0, pots_250g: 0, prix_kg: 0
        };
      },
      error: (err) => {
        console.error("Erreur:", err);
        alert("Erreur lors de l'ajout. Vérifie que le serveur tourne !");
      }
    });
  }
  
  supprimerStock(id: number) {
      if(confirm("Veux-tu vraiment supprimer cette récolte ?")) {
          this.api.deleteStock(id).subscribe(() => this.chargerStocks());
      }
  }
}