import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

export interface SewaTrackingItem {
  id: number;
  sewaName: string;
  branch: string;
  date: string;
  status: string;
  count?: number;
}

export interface ProgramJourneyItem {
  id: number;
  programName: string;
  date: string;
  status: string;
  branch: string;
}

export interface DonationItem {
  id: number;
  amount: number;
  date: string;
  type: string;
  branch: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, ModalComponent],
  selector: 'app-sewa-tracking-modal',
  templateUrl: './sewa-tracking-modal.component.html',
  styleUrls: ['./sewa-tracking-modal.component.scss']
})
export class SewaTrackingModalComponent {
  @Input() isOpen: boolean = false;
  @Input() branchName: string = 'NURMAHAL';
  @Output() close = new EventEmitter<void>();

  activeTab: 'sewa' | 'program' | 'donation' = 'sewa';

  // Data arrays - will be loaded from API
  sewaTrackingData: SewaTrackingItem[] = [];
  programJourneyData: ProgramJourneyItem[] = [];
  donationData: DonationItem[] = [];

  setActiveTab(tab: 'sewa' | 'program' | 'donation'): void {
    this.activeTab = tab;
  }

  onClose(): void {
    this.close.emit();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  trackById(index: number, item: SewaTrackingItem | ProgramJourneyItem | DonationItem): number {
    return item.id;
  }
}

