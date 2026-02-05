export interface StockMiel {
  id?: number;
  type_miel: 'Printemps' | 'Été' | 'Forêt' | 'Toutes fleurs';
  annee: number;
  poids_total: number;
  pots_500g: number;
  pots_250g: number;
  prix_unitaire: number;
  user_id: number;
}
