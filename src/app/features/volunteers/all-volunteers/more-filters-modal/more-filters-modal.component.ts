import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/dropdown/dropdown.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, DropdownComponent],
  selector: 'app-more-filters-modal',
  templateUrl: './more-filters-modal.component.html',
  styleUrls: ['./more-filters-modal.component.scss']
})
export class MoreFiltersModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() filters: any = {};
  @Output() close = new EventEmitter<void>();
  @Output() applyFilters = new EventEmitter<any>();

  // Filter values
  correspondingBranch: any[] = [];
  branchSearchType: any[] = [];
  sewa: any[] = [];
  sewaInterest: any[] = [];
  sewaAllocated: any[] = [];
  sewaMode: any[] = [];

  // Options
  correspondingBranchOptions: DropdownOption[] = [];
  branchSearchTypeOptions: DropdownOption[] = [];
  sewaOptions: DropdownOption[] = [];
  sewaInterestOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' }
  ];
  sewaAllocatedOptions: DropdownOption[] = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' }
  ];
  sewaModeOptions: DropdownOption[] = [
    { id: '1', label: 'Regular', value: 'regular' },
    { id: '2', label: 'Occasional', value: 'occasional' }
  ];

  constructor() {
    // Initialize options - replace with actual API data
    this.correspondingBranchOptions = [
      { id: '1', label: 'Nurmahal', value: 'Nurmahal' },
      { id: '2', label: 'Jalandhar', value: 'Jalandhar' },
      { id: '3', label: 'Ludhiana', value: 'Ludhiana' }
    ];

    this.branchSearchTypeOptions = [
      { id: '1', label: 'Exact Match', value: 'exact' },
      { id: '2', label: 'Contains', value: 'contains' },
      { id: '3', label: 'Starts With', value: 'startsWith' }
    ];

    this.sewaOptions = [
      { id: '1', label: 'Jal Sewa', value: 'Jal Sewa' },
      { id: '2', label: 'Food Distribution', value: 'Food Distribution' },
      { id: '3', label: 'Medical Camp', value: 'Medical Camp' }
    ];
  }

  ngOnChanges(): void {
    if (this.filters) {
      this.correspondingBranch = this.filters.correspondingBranch || [];
      this.branchSearchType = this.filters.branchSearchType || [];
      this.sewa = this.filters.sewa || [];
      this.sewaInterest = this.filters.sewaInterest || [];
      this.sewaAllocated = this.filters.sewaAllocated || [];
      this.sewaMode = this.filters.sewaMode || [];
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onApply(): void {
    const filterData = {
      correspondingBranch: this.correspondingBranch,
      branchSearchType: this.branchSearchType,
      sewa: this.sewa,
      sewaInterest: this.sewaInterest,
      sewaAllocated: this.sewaAllocated,
      sewaMode: this.sewaMode
    };
    this.applyFilters.emit(filterData);
    this.onClose();
  }

  onReset(): void {
    this.correspondingBranch = [];
    this.branchSearchType = [];
    this.sewa = [];
    this.sewaInterest = [];
    this.sewaAllocated = [];
    this.sewaMode = [];
  }
}

