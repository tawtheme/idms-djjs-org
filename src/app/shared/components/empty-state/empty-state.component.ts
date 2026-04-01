import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface EmptyStateConfig {
  title: string;
  description: string;
  icon: string;
  buttonText?: string;
  buttonIcon?: string;
  showButton?: boolean;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() title: string = 'No data found';
  @Input() description: string = 'There are no items to display at the moment.';
  @Input() icon: string = 'search_off';
  @Input() buttonText?: string;
  @Input() buttonIcon?: string;
  @Input() showButton: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() variant: 'default' | 'minimal' | 'illustrated' = 'default';
  
  @Output() buttonClick = new EventEmitter<void>();

  onButtonClick(): void {
    this.buttonClick.emit();
  }
}
