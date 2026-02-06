import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal d-block" style="background: rgba(0, 0, 0, 0.8); z-index: 1060" *ngIf="isOpen">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark shadow-lg" [ngClass]="'border-' + colorType">
          <div class="modal-header border-secondary">
            <h5 class="modal-title fw-bold" [ngClass]="'text-' + colorType">
              <i class="bi" [ngClass]="iconClass"></i> {{ title }}
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="onCancel()"></button>
          </div>

          <div class="modal-body text-white text-center p-4">
            <p class="fs-5 mb-0">{{ message }}</p>
            <p class="text-muted small mt-2" *ngIf="subMessage">{{ subMessage }}</p>
          </div>

          <div class="modal-footer border-secondary justify-content-center">
            <button type="button" class="btn btn-outline-light px-4" (click)="onCancel()">
              Annuler
            </button>
            <button
              type="button"
              class="btn fw-bold px-4"
              [ngClass]="'btn-' + colorType"
              (click)="onConfirm()"
            >
              {{ actionLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmation';
  @Input() message = '';
  @Input() subMessage = '';
  @Input() actionLabel = 'Confirmer';

  // 'danger' (rouge), 'warning' (jaune), 'success' (vert)
  @Input() colorType: 'danger' | 'warning' | 'success' = 'warning';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get iconClass() {
    if (this.colorType === 'danger') return 'bi-exclamation-triangle-fill me-2';
    if (this.colorType === 'success') return 'bi-check-circle-fill me-2';
    return 'bi-info-circle-fill me-2';
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
