import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  register(userData: User) {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  getStocks(userId: number) {
    return this.http.get(`${this.apiUrl}/stocks/${userId}`);
  }

  addStock(stockData: any) {
    return this.http.post(`${this.apiUrl}/stocks`, stockData);
  }

  deleteStock(id: number) {
    return this.http.delete(`${this.apiUrl}/stocks/${id}`);
  }

  updateStock(id: number, data: any) {
    return this.http.put(`${this.apiUrl}/stocks/${id}`, data);
  }

  sendOrder(orderData: any) {
    return this.http.post(`${this.apiUrl}/send-email`, orderData);
  }

  saveOrder(orderData: any) {
    return this.http.post(`${this.apiUrl}/orders`, orderData);
  }

  getUserOrders(userId: number) {
    return this.http.get(`${this.apiUrl}/orders/${userId}`);
  }
}
