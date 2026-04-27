import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DataService } from '../../../data.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { UnallocatedSectionComponent } from './unallocated-section/unallocated-section.component';
import { AllocatedSectionComponent } from './allocated-section/allocated-section.component';
import { OptionsService } from '../../../core/services/options.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

export interface UnallocatedVolunteer {
  id: number | string;
  uniqueId?: string;
  name: string;
  image?: string;
  phone?: string;
}

export interface AllocatedVolunteer {
  id: number | string;
  userId?: string;
  sewaId?: string;
  uniqueId?: string;
  badgeNo?: string;
  name: string;
  image?: string;
  head?: string;
  subHead?: string;
  headChecked?: boolean;
  subHeadChecked?: boolean;
  isRegular: boolean;
  sewa?: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DropdownComponent,
    BreadcrumbComponent,
    UnallocatedSectionComponent,
    AllocatedSectionComponent,
    IconComponent
  ],
  selector: 'app-allocate-sewa',
  templateUrl: './allocate-sewa.component.html',
  styleUrls: ['./allocate-sewa.component.scss']
})
export class AllocateSewaComponent implements OnInit {
  @ViewChild(UnallocatedSectionComponent) unallocatedSection!: UnallocatedSectionComponent;
  @ViewChild(AllocatedSectionComponent) allocatedSection!: AllocatedSectionComponent;

  private dataService = inject(DataService);
  private optionsService = inject(OptionsService);

  // Filter State
  selectedAssignmentBranch: any[] = [];
  selectedTaskBranch: any[] = [];
  selectedCorrespondingBranch: any[] = [];
  selectedBranchSearchType: any[] = [];
  selectedSewaType: any[] = [];
  selectedSewa: any[] = [];
  selectedGender: any[] = [];
  uid: string = '';

  // Unassign modal state
  showUnassignModal = false;
  unassignReason = '';
  unassignRemarks = '';
  unassignError: string | null = null;
  isUnassigning = false;
  checkUserAlreadyAssign = false;
  pendingUnassignVolunteers: AllocatedVolunteer[] = [];

  // Options
  branchOptions: DropdownOption[] = [];
  sewaOptions: DropdownOption[] = [];

  branchSearchTypeOptions: DropdownOption[] = [
    { id: 'none', label: 'None', value: '' },
    { id: 'in_both', label: 'In Both', value: 'in_both' }
  ];

  sewaTypeOptions: DropdownOption[] = [];

  genderOptions: DropdownOption[] = [
    { id: 'male', label: 'Male', value: 'Male' },
    { id: 'female', label: 'Female', value: 'Female' },
    { id: 'other', label: 'Other', value: 'Other' }
  ];

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Sewa', route: '/sewa' },
    { label: 'Allocate Sewa', route: '/sewa/allocate-sewa' }
  ];

  constructor() {
  }

  ngOnInit(): void {
    this.loadMasterData();
    // Default search types if needed:
    this.selectedBranchSearchType = [this.branchSearchTypeOptions[0].value];
    // selectedSewaType will be set after API loads

    // Initial search to load data
    this.onSearch();
  }

  private canSearch(): boolean {
    const hasSewaType = this.selectedSewaType.length > 0;
    const hasSewaOrUid = this.selectedSewa.length > 0 || !!this.uid;
    return hasSewaType && hasSewaOrUid;
  }

  loadMasterData(): void {
    // Load Branches using OptionsService
    this.optionsService.getBranches().subscribe({
      next: (options) => {
        this.branchOptions = options;
      },
      error: (err) => console.error('Failed to load branches', err)
    });

    // Sewa Type is static - represents volunteer vs regular
    this.sewaTypeOptions = [
      { id: 'volunteer', label: 'Volunteer', value: 'Volunteer' },
      { id: 'preacher', label: 'Preacher', value: 'Preacher' },
      { id: 'desiring_devotee', label: 'Desiring Devotee', value: 'DesiringDevotee' }
    ];

    // Set default selection to first option if available and not already selected
    if (this.sewaTypeOptions.length > 0 && this.selectedSewaType.length === 0) {
      this.selectedSewaType = [this.sewaTypeOptions[0].value];
    }

    // Load sewas based on the default selected type
    this.loadSewaOptions();
  }

  loadSewaOptions(): void {
    const type = this.selectedSewaType.length > 0 ? this.selectedSewaType[0] : null;
    if (type) {
      this.optionsService.getSewasByType(type).subscribe({
        next: (options) => this.sewaOptions = options,
        error: (err) => {
          console.error('Failed to load sewas by type', err);
          this.sewaOptions = [];
        }
      });
    } else {
      // Fallback: load all sewas if no type selected
      this.optionsService.getSewas().subscribe(options => {
        this.sewaOptions = options;
      });
    }
  }

  onSewaTypeChange(event: any[]): void {
    this.selectedSewaType = event;
    this.selectedSewa = []; // Clear selected sewa when type changes
    this.loadSewaOptions();
    this.onSearch();
  }

  onSearch(): void {
    if (!this.canSearch()) return;

    const filters: any = {};
    // Map component state to API parameters
    if (this.selectedAssignmentBranch.length) filters['sewa_assigned_branch_id'] = this.selectedAssignmentBranch[0];
    if (this.selectedTaskBranch.length) filters['branch_id'] = this.selectedTaskBranch[0];
    if (this.selectedCorrespondingBranch.length) filters['home_branch'] = this.selectedCorrespondingBranch[0];
    if (this.selectedBranchSearchType.length && this.selectedBranchSearchType[0]) filters['branch_type'] = this.selectedBranchSearchType[0];
    if (this.selectedSewaType.length) filters['sewa_type'] = this.selectedSewaType[0];
    if (this.selectedSewa.length) filters['sewa_id'] = this.selectedSewa[0];
    if (this.selectedGender.length) filters['gender'] = this.selectedGender[0];
    if (this.uid) filters['unique_id'] = this.uid;

    if (this.unallocatedSection) this.unallocatedSection.loadVolunteers(filters);
    if (this.allocatedSection) this.allocatedSection.loadVolunteers(filters);
  }


  onAllocate(volunteers: UnallocatedVolunteer[]): void {
    if (volunteers.length === 0) return;

    // Validate required filter selections
    if (!this.selectedSewa.length) {
      alert('Please select a Sewa before allocating volunteers.');
      return;
    }
    if (!this.selectedTaskBranch.length) {
      alert('Please select a Task Branch before allocating volunteers.');
      return;
    }
    if (!this.selectedAssignmentBranch.length) {
      alert('Please select a Sewa Assignment Branch before allocating volunteers.');
      return;
    }

    const userIds = volunteers.map(v => v.id);
    const payload = {
      sewa_id: this.selectedSewa[0],
      branch_id: this.selectedTaskBranch[0],
      sewa_assigned_branch_id: this.selectedAssignmentBranch[0],
      ids: userIds
    };

    this.dataService.post('v1/user-sewas/bulk-assign', payload).pipe(
      catchError((error) => {
        console.error('Error allocating volunteers:', error);
        alert('Failed to allocate volunteers. Please try again.');
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {
        console.log('Successfully allocated volunteers:', response);
        // Refresh both lists after successful allocation
        this.onSearch();
      }
    });
  }

  onUnassign(volunteers: AllocatedVolunteer[]): void {
    if (volunteers.length === 0) return;
    this.pendingUnassignVolunteers = volunteers;
    this.unassignReason = '';
    this.unassignRemarks = '';
    this.checkUserAlreadyAssign = false;
    this.unassignError = null;
    this.showUnassignModal = true;
  }

  closeUnassignModal(): void {
    if (this.isUnassigning) return;
    this.showUnassignModal = false;
    this.pendingUnassignVolunteers = [];
  }

  confirmUnassign(): void {
    if (!this.unassignReason.trim()) {
      this.unassignError = 'Reason is required.';
      return;
    }
    if (!this.selectedSewa.length) {
      this.unassignError = 'Please select a Sewa.';
      return;
    }
    if (this.pendingUnassignVolunteers.length === 0) {
      this.unassignError = 'No volunteers selected.';
      return;
    }

    const body = {
      sewa_id: String(this.selectedSewa[0]),
      is_check_userAlreadyAssign: this.checkUserAlreadyAssign ? '1' : '0',
      reason: this.unassignReason.trim(),
      remark: this.unassignRemarks.trim(),
      ids: this.pendingUnassignVolunteers.map(v => String(v.id))
    };

    this.isUnassigning = true;
    this.unassignError = null;
    this.dataService.post<any>('v1/user-sewas/bulk-unassign', body).pipe(
      catchError((err) => {
        this.unassignError = err?.error?.message || 'Failed to unassign volunteers.';
        return of(null);
      }),
      finalize(() => this.isUnassigning = false)
    ).subscribe((response) => {
      if (response === null) return;
      this.showUnassignModal = false;
      this.pendingUnassignVolunteers = [];
      this.onSearch();
    });
  }
}
