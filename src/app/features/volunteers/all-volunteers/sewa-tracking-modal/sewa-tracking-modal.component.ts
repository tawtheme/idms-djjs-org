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

  // Sample data for Sewa Tracking
  sewaTrackingData: SewaTrackingItem[] = [
    { id: 1, sewaName: 'Jal Sewa Sis(Nurmahal)', branch: 'Nurmahal', date: '2025-01-15', status: 'Active', count: 36 },
    { id: 2, sewaName: 'Food Distribution', branch: 'Nurmahal', date: '2025-01-20', status: 'Active', count: 12 },
    { id: 3, sewaName: 'Medical Camp', branch: 'Nurmahal', date: '2025-02-01', status: 'Completed', count: 8 }
  ];

  // Sample data for Program Journey
  programJourneyData: ProgramJourneyItem[] = [
    { id: 1, programName: 'Yoga Workshop', date: '2025-01-10', status: 'Completed', branch: 'Nurmahal' },
    { id: 2, programName: 'Meditation Session', date: '2025-01-25', status: 'Active', branch: 'Nurmahal' },
    { id: 3, programName: 'Spiritual Discourse', date: '2025-02-05', status: 'Upcoming', branch: 'Nurmahal' }
  ];

  // Sample data for Donations
  donationData: DonationItem[] = [
    { id: 1, amount: 5000, date: '2025-01-12', type: 'Cash', branch: 'Nurmahal' },
    { id: 2, amount: 10000, date: '2025-01-18', type: 'Online', branch: 'Nurmahal' },
    { id: 3, amount: 2500, date: '2025-01-30', type: 'Cheque', branch: 'Nurmahal' }
  ];

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

