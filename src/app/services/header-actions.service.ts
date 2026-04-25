import { Injectable, signal } from '@angular/core';

export interface HeaderAction {
  label: string;
  icon?: string;
  type?: 'primary' | 'secondary';
  onClick: () => void;
}

@Injectable({ providedIn: 'root' })
export class HeaderActionsService {
  readonly action = signal<HeaderAction | null>(null);

  set(action: HeaderAction): void {
    this.action.set(action);
  }

  clear(): void {
    this.action.set(null);
  }
}
