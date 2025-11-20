import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardSize = 'small' | 'medium' | 'large';
export type CardVariant = 'default' | 'elevated' | 'outlined';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() size: CardSize = 'medium';
  @Input() variant: CardVariant = 'default';
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() clickable: boolean = false;

  get cardClasses(): string {
    return [
      'card',
      `card-${this.size}`,
      `card-${this.variant}`,
      this.clickable ? 'card-clickable' : ''
    ].filter(Boolean).join(' ');
  }
}
