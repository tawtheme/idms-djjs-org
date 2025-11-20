import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DropdownComponent, DropdownOption } from '../../shared/components/dropdown/dropdown.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { MenuDropdownComponent } from '../../shared/components/menu-dropdown/menu-dropdown.component';
import type { MenuOption } from '../../shared/components/menu-dropdown/menu-dropdown.component';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { JobDetailComponent } from './detail/job-detail.component';
import { TooltipDirective } from '../../shared/components/tooltip/tooltip.directive';
import { DataService } from '../../data.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ScrollingModule, DropdownComponent, BreadcrumbComponent, MenuDropdownComponent, PagerComponent, ModalComponent, JobDetailComponent, TooltipDirective],
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.scss']
})
export class JobsComponent {
  jobs: Array<any> = [];
  allJobs: Array<any> = [];
  searchQuery: string = '';
  typeQuery: string = '';

  // Filter dropdowns
  assignedOptions: DropdownOption[] = [];
  statusOptions: DropdownOption[] = [];
  selectedAssigned: any[] = [];
  selectedStatus: any[] = [];
  actionOptions: MenuOption[] = [
    { id: 'view', label: 'View', value: 'view', icon: 'visibility' },
    { id: 'edit', label: 'Edit', value: 'edit', icon: 'edit' }
  ];

  // Job workflow stages
  jobStages = [
    { id: 'production-manager', label: 'Production Manager', key: 'production_manager' },
    { id: 'per-press', label: 'Per Press Department', key: 'per_press' },
    { id: 'press-dept', label: 'Press Department', key: 'press_dept' },
    { id: 'qa', label: 'QA Department', key: 'qa' },
    { id: 'finishing', label: 'Finishing Department', key: 'finishing' }
  ];


  // Pagination
  pageSizeOptions: number[] = [20, 50, 100];
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;
  
  // Modal
  detailModalOpen = false;
  selectedJobId: string | null = null;
  selectedJob: any = null;
  loadingJob = false;
  
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Jobs', route: '/jobs' },
  ];

  constructor(private http: HttpClient, private router: Router, private data: DataService) {
    this.http.get<{ jobs: any[], filters?: { status?: string[] } }>('assets/mock/jobs.json').subscribe({
      next: (res) => {
        this.allJobs = res?.jobs || [];
        this.buildFilterOptions(res?.filters);
        this.applyFilter();
        this.totalItems = this.jobs.length;
      },
      error: () => {
        this.allJobs = [];
        this.jobs = [];
        this.totalItems = 0;
      }
    });
  }

  onAction(job: any, action: string): void {
    if (!action) return;
    switch (action) {
      case 'view':
        this.openDetailModal(job.job_id);
        break;
      case 'edit':
        this.router.navigate(['/jobs/create']);
        break;
    }
  }

  openDetailModal(jobId: string): void {
    this.selectedJobId = jobId;
    this.detailModalOpen = true;
    this.loadJobForModal(jobId);
  }

  private loadJobForModal(jobId: string): void {
    this.loadingJob = true;
    this.selectedJob = null;
    this.data.getJson<{ jobs: any[] }>('jobs.json').subscribe({
      next: (response) => {
        const jobs = response?.jobs || [];
        this.selectedJob = jobs.find((j) => j.job_id === jobId) || null;
        this.loadingJob = false;
      },
      error: () => {
        this.selectedJob = null;
        this.loadingJob = false;
      }
    });
  }

  closeDetailModal(): void {
    this.detailModalOpen = false;
    this.selectedJobId = null;
    this.selectedJob = null;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  resetFilter(): void {
    this.searchQuery = '';
    this.typeQuery = '';
    this.selectedAssigned = [];
    this.selectedStatus = [];
    this.applyFilter();
  }

  get pagedJobs(): Array<any> {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.jobs.slice(start, start + this.pageSize);
  }

  applyFilter(): void {
    const q = (this.searchQuery || '').toLowerCase().trim();
    const tq = (this.typeQuery || '').toLowerCase().trim();
    const assigned = this.selectedAssigned[0] || '';
    const status = this.selectedStatus[0] || '';
    if (!q) {
      this.jobs = [...this.allJobs];
    } else {
      this.jobs = this.allJobs.filter(j => {
        return (
          (j.job_id || '').toLowerCase().includes(q) ||
          (j.job_title || '').toLowerCase().includes(q) ||
          (j.company_name || '').toLowerCase().includes(q) ||
          (j.assigned_to || '').toLowerCase().includes(q) ||
          (j.status || '').toLowerCase().includes(q)
        );
      });
    }

    // Type filter
    if (tq) {
      this.jobs = this.jobs.filter(j => (j.job_type || '').toLowerCase().includes(tq));
    }

    // Assigned filter
    if (assigned) {
      this.jobs = this.jobs.filter(j => (j.assigned_to || '') === assigned);
    }

    // Status filter
    if (status) {
      this.jobs = this.jobs.filter(j => (j.status || '') === status);
    }

    // Reset pagination after filtering
    this.totalItems = this.jobs.length;
    this.currentPage = 1;
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Math.max(20, size);
    this.currentPage = 1;
  }

  private buildFilterOptions(filters?: { status?: string[] }): void {
    const assignSet = new Set<string>();
    for (const j of this.allJobs) {
      if (j.assigned_to) assignSet.add(j.assigned_to);
    }
    this.assignedOptions = Array.from(assignSet).map((v, idx) => ({ id: String(idx + 1), label: v, value: v }));
    
    // Use status values from JSON filters if available, otherwise build from job data
    if (filters?.status && filters.status.length > 0) {
      this.statusOptions = filters.status.map((v, idx) => ({ id: String(idx + 1), label: v, value: v }));
    } else {
      const statusSet = new Set<string>();
      for (const j of this.allJobs) {
        if (j.status) statusSet.add(j.status);
      }
      this.statusOptions = Array.from(statusSet).map((v, idx) => ({ id: String(idx + 1), label: v, value: v }));
    }
  }

  // Get current stage for a job based on status or production_stage field
  getCurrentStage(job: any): string {
    // If job has production_stage field, use it
    if (job.production_stage) {
      return job.production_stage;
    }
    
    // Otherwise, map status to stage
    const status = (job.status || '').toLowerCase();
    if (status === 'pending') {
      return 'production_manager';
    } else if (status === 'inprogress' || status === 'in progress') {
      // For in-progress jobs, we could use a default stage or check other fields
      return job.current_stage || 'per_press';
    } else if (status === 'completed') {
      return 'finishing';
    } else if (status === 'cancel' || status === 'cancelled') {
      return 'production_manager';
    }
    
    return 'production_manager';
  }

  // Get stage index for visual positioning
  getStageIndex(stageKey: string): number {
    return this.jobStages.findIndex(s => s.key === stageKey);
  }

  // Check if stage is completed (before current stage)
  isStageCompleted(job: any, stageKey: string): boolean {
    const currentStage = this.getCurrentStage(job);
    const currentIndex = this.getStageIndex(currentStage);
    const stageIndex = this.getStageIndex(stageKey);
    return stageIndex < currentIndex;
  }

  // Check if stage is current
  isCurrentStage(job: any, stageKey: string): boolean {
    return this.getCurrentStage(job) === stageKey;
  }

  // Get current stage label for display
  getCurrentStageLabel(job: any): string {
    const currentStage = this.getCurrentStage(job);
    const stage = this.jobStages.find(s => s.key === currentStage);
    return stage ? stage.label : 'Production Manager';
  }

  // Get progress percentage based on current stage
  getStageProgress(job: any): number {
    const currentStage = this.getCurrentStage(job);
    const currentIndex = this.getStageIndex(currentStage);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / this.jobStages.length) * 100);
  }

}


