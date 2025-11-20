import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';
import { ActivityComponent, ActivityLogItem } from './activity/activity.component';
import { StageComponent, JobStageActivity } from './stage/stage.component';
import { ItemsComponent, JobItem } from './items/items.component';

interface JobDetailModel {
  job_id: string;
  job_title: string;
  job_type: string;
  job_description?: string;
  priority: string;
  status: string;
  customer_name: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  billing_address?: string;
  shipping_address?: string;
  order_source: string;
  order_number?: string;
  po_number?: string;
  order_date?: string;
  due_date: string;
  assigned_to: string;
  quantity: number;
  size: string;
  paper_type: string;
  paper_gsm: string;
  print_side: string;
  color_mode: string;
  finishing_options?: string[];
  binding_type: string;
  folding_type: string;
  proof_required: boolean;
  artwork_files?: string[];
  proof_file?: string;
  designer_assigned?: string;
  design_notes?: string;
  production_stage?: string;
  machine?: string;
  operator?: string;
  material_used?: string;
  qc_approved_by?: string;
  qc_approval_date?: string;
  checklist?: string;
  estimated_cost?: number;
  actual_cost?: number;
  selling_price?: number;
  discount_percent?: number;
  tax_percent?: number;
  total_amount: number;
  payment_status: string;
  invoice_number?: string;
  payment_mode?: string;
  delivery_method: string;
  tracking_number?: string;
  delivery_date?: string;
  delivered_by?: string;
  delivery_confirmation?: boolean;
  internal_remarks?: string;
  customer_feedback?: string;
  job_closure_status?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  stage_activities?: JobStageActivity[];
  activity_log?: ActivityLogItem[];
}

interface JobDetailResponse {
  jobs: JobDetailModel[];
}

@Component({
  standalone: true,
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss'],
  imports: [CommonModule, ActivityComponent, StageComponent, ItemsComponent]
})
export class JobDetailComponent implements OnInit, OnChanges {
  @Input() jobId: string | null = null;
  @Output() cancel = new EventEmitter<void>();
  loading = false;
  job: JobDetailModel | null = null;
  private loadingJobId: string | null = null;
  
  // Cached job items to prevent change detection loops
  cachedJobItems: JobItem[] = [];

  // Job workflow stages
  jobStages = [
    { id: 'production-manager', label: 'Production Manager', key: 'production_manager', description: 'Editorial Reception and Planning' },
    { id: 'per-press', label: 'Per Press Department', key: 'per_press', description: 'Design and Layout, Pre-Press' },
    { id: 'press-dept', label: 'Press Department', key: 'press_dept', description: 'Press (Printing), Post-Press and Finishing' },
    { id: 'qa', label: 'QA Department', key: 'qa', description: 'Post-Press and Finishing' },
    { id: 'finishing', label: 'Finishing Department', key: 'finishing', description: 'Packaging and Distribution' }
  ];


  constructor(private data: DataService, private cdr: ChangeDetectorRef) {}

  // ==================== Lifecycle Methods ====================
  ngOnInit(): void {
    // Load job if jobId is set and we haven't loaded yet
    // This handles the case where component is created with *ngIf and jobId is set
    // Note: ngOnChanges fires before ngOnInit, so if it already started loading, this won't run
    if (this.jobId && !this.job && !this.loading && this.loadingJobId !== this.jobId) {
      this.loadJob();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle jobId changes
    // Note: ngOnChanges fires before ngOnInit
    if (changes['jobId']) {
      const newJobId = changes['jobId'].currentValue;
      const previousJobId = changes['jobId'].previousValue;
      
      // If jobId changed (including initial set from undefined to a value), load the job
      if (newJobId !== previousJobId) {
        // Reset state when jobId changes
        this.job = null;
        this.loading = false;
        this.loadingJobId = null;
        // Clear cached values
        this.cachedJobItems = [];
        
        if (newJobId) {
          this.loadJob();
        }
      }
    }
  }

  // ==================== Data Loading Methods ====================
  private loadJob(): void {
    if (!this.jobId) {
      this.job = null;
      this.loading = false;
      this.loadingJobId = null;
      return;
    }

    // Prevent multiple simultaneous loads for the same jobId
    if (this.loading && this.loadingJobId === this.jobId) {
      return;
    }

    this.loading = true;
    this.loadingJobId = this.jobId;
    this.job = null; // Clear previous job data
    
    this.data.getJson<JobDetailResponse>('jobs.json').subscribe({
      next: (response) => {
        try {
          const jobs = response?.jobs || [];
          const found = jobs.find((j) => j.job_id === this.jobId);
          
          if (found) {
            try {
              // Generate stage activities and activity log if not present
              this.job = {
                ...found,
                stage_activities: this.generateStageActivities(found),
                activity_log: this.generateActivityLog(found)
              };
              // Update cached job items
              this.updateCachedJobItems();
            } catch (genError) {
              console.error('[JobDetail] loadJob: Error generating stage activities/log:', genError);
              // If generation fails, still set the job without activities
              this.job = {
                ...found,
                stage_activities: [],
                activity_log: []
              };
              // Update cached job items even on error
              this.updateCachedJobItems();
            }
          } else {
            this.job = null;
          }
        } catch (error) {
          console.error('[JobDetail] loadJob: Error processing job data:', error);
          this.job = null;
        } finally {
          this.loading = false;
          this.loadingJobId = null;
          // Use setTimeout to avoid change detection issues
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        }
      },
      error: (error) => {
        console.error('[JobDetail] loadJob: HTTP error:', error);
        this.job = null;
        this.loading = false;
        this.loadingJobId = null;
        // Use setTimeout to avoid change detection issues
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  // ==================== Stage Generation Methods ====================
  private generateStageActivities(job: any): JobStageActivity[] {
    try {
      const currentStage = this.getCurrentStage(job);
      const activities: JobStageActivity[] = [];

      this.jobStages.forEach((stage, index) => {
        try {
          const isCompleted = this.isStageCompleted(job, stage.key);
          const isCurrent = this.isCurrentStage(job, stage.key);
          
          activities.push({
            stage: stage.key,
            stage_label: stage.label,
            assigned_to: this.getStageAssignee(job, stage.key),
            started_at: isCompleted || isCurrent ? job.created_at : undefined,
            completed_at: isCompleted ? job.updated_at : undefined,
            status: isCompleted ? 'completed' : (isCurrent ? 'in_progress' : 'pending'),
            notes: this.getStageNotes(job, stage.key)
          });
        } catch (error) {
          console.error(`Error generating stage activity for ${stage.key}:`, error);
          // Continue with other stages even if one fails
        }
      });

      return activities;
    } catch (error) {
      console.error('Error in generateStageActivities:', error);
      return []; // Return empty array on error
    }
  }

  private generateActivityLog(job: any): ActivityLogItem[] {
    try {
      const log: ActivityLogItem[] = [];
      
      // Add creation activity
      if (job.created_at) {
        log.push({
          date: job.created_at,
          action: 'Job created',
          user: job.created_by || 'System',
          stage: 'production_manager'
        });
      }

      // Generate stage activities for the log
      // Wrap in try-catch to prevent errors from blocking
      let stageActivities: JobStageActivity[] = [];
      try {
        stageActivities = this.generateStageActivities(job);
      } catch (error) {
        console.error('Error generating stage activities for log:', error);
        // Continue with empty activities array
      }
      
      stageActivities.forEach((activity: JobStageActivity) => {
        try {
          if (activity.started_at) {
            log.push({
              date: activity.started_at,
              action: `Started: ${activity.stage_label}`,
              user: activity.assigned_to || 'Unassigned',
              stage: activity.stage
            });
          }
          if (activity.completed_at && activity.completed_at !== activity.started_at) {
            log.push({
              date: activity.completed_at,
              action: `Completed: ${activity.stage_label}`,
              user: activity.assigned_to || 'Unassigned',
              stage: activity.stage
            });
          }
        } catch (error) {
          console.error('Error adding activity log entry:', error);
          // Continue with other activities
        }
      });

      // Add update activity
      if (job.updated_at && job.updated_at !== job.created_at) {
        log.push({
          date: job.updated_at,
          action: 'Job updated',
          user: job.created_by || 'System'
        });
      }

      // Sort by date (newest first) with safe date parsing
      return log.sort((a, b) => {
        try {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          // Handle invalid dates
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1; // Put invalid dates at end
          if (isNaN(dateB)) return -1; // Put invalid dates at end
          return dateB - dateA; // newest first
        } catch {
          return 0; // If sorting fails, maintain order
        }
      });
    } catch (error) {
      console.error('Error in generateActivityLog:', error);
      return []; // Return empty array on error
    }
  }

  // ==================== Stage Helper Methods ====================
  private getCurrentStage(job: any): string {
    if (job.production_stage) {
      return job.production_stage;
    }
    
    const status = (job.status || '').toLowerCase();
    if (status === 'pending') {
      return 'production_manager';
    } else if (status === 'inprogress' || status === 'in progress') {
      return job.current_stage || 'per_press';
    } else if (status === 'completed') {
      return 'finishing';
    } else if (status === 'cancel' || status === 'cancelled') {
      return 'production_manager';
    }
    
    return 'production_manager';
  }

  private getStageIndex(stageKey: string): number {
    return this.jobStages.findIndex(s => s.key === stageKey);
  }

  private isStageCompleted(job: any, stageKey: string): boolean {
    const currentStage = this.getCurrentStage(job);
    const currentIndex = this.getStageIndex(currentStage);
    const stageIndex = this.getStageIndex(stageKey);
    return stageIndex < currentIndex;
  }

  private isCurrentStage(job: any, stageKey: string): boolean {
    return this.getCurrentStage(job) === stageKey;
  }

  private getStageAssignee(job: any, stageKey: string): string {
    let assignee: string | undefined;
    switch (stageKey) {
      case 'production_manager':
        assignee = job.assigned_to;
        break;
      case 'per_press':
        assignee = job.designer_assigned;
        break;
      case 'press_dept':
        assignee = job.operator;
        break;
      case 'qa':
        assignee = job.qc_approved_by;
        break;
      case 'finishing':
      case 'packaging':
        assignee = job.delivered_by;
        break;
      default:
        assignee = undefined;
    }
    // Return assignee or 'Unassigned' as default
    return assignee || 'Unassigned';
  }

  private getStageNotes(job: any, stageKey: string): string | undefined {
    switch (stageKey) {
      case 'per_press':
        return job.design_notes;
      case 'press_dept':
        return job.material_used ? `Material: ${job.material_used}` : undefined;
      case 'qa':
        return job.qc_approval_date ? `Approved on ${this.formatDate(job.qc_approval_date)}` : undefined;
      default:
        return undefined;
    }
  }

  private getStageLabel(stageKey: string): string {
    const stage = this.jobStages.find(s => s.key === stageKey);
    return stage ? stage.label : stageKey;
  }

  onStageChange(newStage: string): void {
    if (!this.job || !newStage) return;
    const currentStage = this.getCurrentStage(this.job);
    
    if (newStage === currentStage) return;
    
    // Update the job's production_stage
    this.job.production_stage = newStage;
    this.job.updated_at = new Date().toISOString();
    
    // Regenerate stage activities with new stage
    this.job.stage_activities = this.generateStageActivities(this.job);
    
    // Add activity log entry
    const stageLabel = this.getStageLabel(newStage);
    const newActivityLog: ActivityLogItem = {
      date: new Date().toISOString(),
      action: `Stage updated to: ${stageLabel}`,
      user: 'Current User', // In real app, get from auth service
      stage: newStage
    };
    
    if (this.job.activity_log) {
      this.job.activity_log.unshift(newActivityLog);
    } else {
      this.job.activity_log = [newActivityLog];
    }
    
    // Update started_at for the new stage if it's being started
    const newStageActivity = this.job.stage_activities.find(a => a.stage === newStage);
    if (newStageActivity && !newStageActivity.started_at) {
      newStageActivity.started_at = new Date().toISOString();
      newStageActivity.status = 'in_progress';
    }
    
    // Mark previous stages as completed if moving forward
    const newStageIndex = this.getStageIndex(newStage);
    const currentStageIndex = this.getStageIndex(currentStage);
    
    if (newStageIndex > currentStageIndex) {
      // Moving forward - mark previous stages as completed
      this.job.stage_activities.forEach((activity, index) => {
        if (index < newStageIndex) {
          activity.status = 'completed';
          if (!activity.completed_at) {
            activity.completed_at = new Date().toISOString();
          }
        }
      });
    }
    
    // In a real app, you would save to the backend here
    // this.data.updateJob(this.job.job_id, { production_stage: newStage }).subscribe(...)
  }

  // ==================== Formatting Methods ====================
  getStatusClass(status: string | undefined): string {
    if (!status) {
      return '';
    }
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    return `status-${normalizedStatus}`;
  }

  formatStatus(status: string | undefined): string {
    if (!status) {
      return '';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      
      // Handle invalid dates
      if (isNaN(date.getTime())) {
        return this.formatDateFallback(dateString);
      }

      // Format based on whether it includes time
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      if (dateString.includes('T')) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  }

  private formatDateFallback(dateString: string): string {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
  }

  // ==================== Item Methods ====================
  private updateCachedJobItems(): void {
    if (!this.job) {
      this.cachedJobItems = [];
      return;
    }
    
    // Convert job printing specs to item format for items component
    this.cachedJobItems = [{
      sku: this.job.job_id || '',
      title: this.job.job_title || '',
      quantity: this.job.quantity || 0,
      size: this.job.size,
      paper_type: this.job.paper_type,
      paper_gsm: this.job.paper_gsm,
      print_side: this.job.print_side,
      color_mode: this.job.color_mode,
      binding_type: this.job.binding_type,
      folding_type: this.job.folding_type,
      finishing_options: this.job.finishing_options || []
    }];
  }

  onStageCancel(): void {
    this.cancel.emit();
  }

}

