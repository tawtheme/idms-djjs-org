import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, DropdownComponent],
  selector: 'app-volunteer-cards-filters-modal',
  templateUrl: './filters-modal.component.html',
  styleUrls: ['./filters-modal.component.scss']
})
export class VolunteerCardsFiltersModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() filters: any = {};
  @Output() close = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<any>();

  // Filter values
  taskBranch: any[] = [];
  correspondingBranch: any[] = [];
  branchSearchType: any[] = [];

  // Options
  taskBranchOptions: DropdownOption[] = [];
  correspondingBranchOptions: DropdownOption[] = [];
  branchSearchTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Exact Match', value: 'exact' },
    { id: '2', label: 'Contains', value: 'contains' },
    { id: '3', label: 'Starts With', value: 'startsWith' }
  ];

  constructor() {
    // Initialize options - replace with actual API data
    this.taskBranchOptions = [
      { id: '1', label: 'Nurmahal', value: 'Nurmahal' },
      { id: '2', label: 'Jalandhar', value: 'Jalandhar' },
      { id: '3', label: 'Ludhiana', value: 'Ludhiana' },
      { id: '4', label: 'Amritsar', value: 'Amritsar' },
      { id: '5', label: 'Patiala', value: 'Patiala' }
    ];

    this.correspondingBranchOptions = [
      { id: '1', label: 'Nurmahal', value: 'Nurmahal' },
      { id: '2', label: 'Jalandhar', value: 'Jalandhar' },
      { id: '3', label: 'Ludhiana', value: 'Ludhiana' },
      { id: '4', label: 'Amritsar', value: 'Amritsar' },
      { id: '5', label: 'Patiala', value: 'Patiala' }
    ];
  }

  ngOnChanges(): void {
    if (this.filters) {
      this.taskBranch = this.filters.taskBranch || [];
      this.correspondingBranch = this.filters.correspondingBranch || [];
      this.branchSearchType = this.filters.branchSearchType || [];
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onApply(): void {
    const filterData = {
      taskBranch: this.taskBranch,
      correspondingBranch: this.correspondingBranch,
      branchSearchType: this.branchSearchType
    };
    this.applyFilters.emit(filterData);
    this.onClose();
  }

  onReset(): void {
    this.taskBranch = [];
    this.correspondingBranch = [];
    this.branchSearchType = [];
  }
}

