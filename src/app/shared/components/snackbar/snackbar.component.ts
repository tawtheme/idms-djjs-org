import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface SnackbarConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isVisible) {
    <div class="snackbar" [class]="'snackbar-' + config.type">
      <div class="snackbar-content">
        <div class="snackbar-icon">
          <app-icon [name]="getIcon()" />
        </div>
        <div class="snackbar-message">
          {{ config.message }}
        </div>
        @if (config.action) {
        <button class="snackbar-action" (click)="config.action!.callback()">
          {{ config.action.label }}
        </button>
        }
        <button class="snackbar-close" (click)="hide()">
          <app-icon name="close" />
        </button>
      </div>
    </div>
    }
  `,
  styles: [`
    .snackbar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      max-width: 500px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideInOut 0.3s ease-in-out;
    }

    .snackbar-content {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      gap: 12px;
    }

    .snackbar-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .snackbar-message {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
    }

    .snackbar-action {
      background: none;
      border: none;
      color: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .snackbar-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .snackbar-close:hover {
      opacity: 1;
    }

    /* Type-specific styles */
    .snackbar-success {
      background: #10b981;
      color: white;
    }

    .snackbar-success .snackbar-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .snackbar-success .snackbar-action:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .snackbar-error {
      background: #ef4444;
      color: white;
    }

    .snackbar-error .snackbar-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .snackbar-error .snackbar-action:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .snackbar-warning {
      background: #f59e0b;
      color: white;
    }

    .snackbar-warning .snackbar-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .snackbar-warning .snackbar-action:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .snackbar-info {
      background: #3b82f6;
      color: white;
    }

    .snackbar-info .snackbar-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .snackbar-info .snackbar-action:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    @keyframes slideInOut {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class SnackbarComponent implements OnInit, OnDestroy {
  @Input() config!: SnackbarConfig;
  
  isVisible = false;
  private timeoutId?: number;

  ngOnInit() {
    this.show();
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  show() {
    this.isVisible = true;
    
    // Auto-hide after duration (default 4 seconds)
    const duration = this.config.duration || 4000;
    this.timeoutId = window.setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    this.isVisible = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  getIcon(): string {
    switch (this.config.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
}
