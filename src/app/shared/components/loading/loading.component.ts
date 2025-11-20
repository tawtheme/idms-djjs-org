import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingType = 'spinner' | 'dots' | 'pulse';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  @Input() size: LoadingSize = 'medium';
  @Input() type: LoadingType = 'spinner';
  @Input() message: string = '';
  @Input() overlay: boolean = false;

  get loadingClasses(): string {
    return [
      'loading',
      `loading-${this.size}`,
      `loading-${this.type}`,
      this.overlay ? 'loading-overlay' : ''
    ].filter(Boolean).join(' ');
  }
}
