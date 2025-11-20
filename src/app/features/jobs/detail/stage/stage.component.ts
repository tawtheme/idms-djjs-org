import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface JobStageActivity {
  stage: string;
  stage_label: string;
  assigned_to: string;
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  checklist?: ChecklistItem[];
}

@Component({
  selector: 'app-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.scss']
})
export class StageComponent implements OnChanges {
  @Input() stageActivities: JobStageActivity[] = [];
  @Input() title: string = 'Job Stages & Workflow';
  @Input() showTitle: boolean = true;
  @Input() viewMode: 'accordion' = 'accordion';
  @Output() cancel = new EventEmitter<void>();

  // Cache for checklist items and progress
  private checklistCache = new Map<JobStageActivity, ChecklistItem[]>();
  private progressCache = new Map<JobStageActivity, { completed: number; total: number; percentage: number }>();

  // Accordion view state
  expandedStages: Set<number> = new Set();

  toggleAccordion(index: number): void {
    if (this.expandedStages.has(index)) {
      this.expandedStages.delete(index);
    } else {
      this.expandedStages.add(index);
    }
  }

  isAccordionExpanded(index: number): boolean {
    return this.expandedStages.has(index);
  }

  getStatusLabel(status: string): string {
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    return 'Pending';
  }

  getStatusIcon(status: string): string {
    if (status === 'completed') return 'check_circle';
    if (status === 'in_progress') return 'schedule';
    return 'pending';
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stageActivities']) {
      this.updateChecklistCache();
      this.expandCurrentStage();
    }
  }

  private expandCurrentStage(): void {
    if (!this.stageActivities || this.stageActivities.length === 0) {
      return;
    }

    // Clear previous expanded stages when data changes
    this.expandedStages.clear();

    // Find the current stage (status === 'in_progress')
    const currentStageIndex = this.stageActivities.findIndex(
      activity => activity.status === 'in_progress'
    );

    // If no in_progress stage found, find the first pending stage
    if (currentStageIndex === -1) {
      const firstPendingIndex = this.stageActivities.findIndex(
        activity => activity.status === 'pending'
      );
      if (firstPendingIndex !== -1) {
        this.expandedStages.add(firstPendingIndex);
      }
    } else {
      // Expand the current stage
      this.expandedStages.add(currentStageIndex);
    }
  }

  hasStages(): boolean {
    return this.stageActivities && this.stageActivities.length > 0;
  }

  private updateChecklistCache(): void {
    this.checklistCache.clear();
    this.progressCache.clear();
    
    if (!this.stageActivities) return;

    this.stageActivities.forEach(activity => {
      const checklist = this.getChecklistItemsInternal(activity);
      this.checklistCache.set(activity, checklist);
      
      const completed = checklist.filter(item => item.completed).length;
      const total = checklist.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      this.progressCache.set(activity, { completed, total, percentage });
    });
  }

  getChecklistItems(activity: JobStageActivity): ChecklistItem[] {
    if (this.checklistCache.has(activity)) {
      return this.checklistCache.get(activity)!;
    }
    const checklist = this.getChecklistItemsInternal(activity);
    this.checklistCache.set(activity, checklist);
    return checklist;
  }

  private getChecklistItemsInternal(activity: JobStageActivity): ChecklistItem[] {
    let checklist: ChecklistItem[];
    
    if (activity.checklist && activity.checklist.length > 0) {
      checklist = [...activity.checklist];
    } else {
      // Return default checklist items based on stage if no checklist provided
      checklist = this.getDefaultChecklist(activity.stage);
    }
    
    // If stage is completed, mark all items as completed
    if (activity.status === 'completed') {
      checklist = checklist.map(item => ({
        ...item,
        completed: true
      }));
    }
    
    return checklist;
  }

  private getDefaultChecklist(stage: string): ChecklistItem[] {
    const checklists: { [key: string]: ChecklistItem[] } = {
      'production_manager': [
        { id: '1', label: 'Review job requirements and specifications', completed: false },
        { id: '2', label: 'Verify artwork files received', completed: false },
        { id: '3', label: 'Check material availability', completed: false },
        { id: '4', label: 'Assign production team', completed: false },
        { id: '5', label: 'Schedule production timeline', completed: false }
      ],
      'per_press': [
        { id: '1', label: 'Design and layout review', completed: false },
        { id: '2', label: 'Pre-press file preparation', completed: false },
        { id: '3', label: 'Color proofing setup', completed: false },
        { id: '4', label: 'Print quality check', completed: false },
        { id: '5', label: 'Finalize artwork for printing', completed: false }
      ],
      'press_dept': [
        { id: '1', label: 'Setup printing machine', completed: false },
        { id: '2', label: 'Load paper and materials', completed: false },
        { id: '3', label: 'Calibrate color settings', completed: false },
        { id: '4', label: 'Run test prints', completed: false },
        { id: '5', label: 'Begin production printing', completed: false },
        { id: '6', label: 'Post-press finishing setup', completed: false }
      ],
      'qa': [
        { id: '1', label: 'Visual quality inspection', completed: false },
        { id: '2', label: 'Color accuracy check', completed: false },
        { id: '3', label: 'Dimension and alignment verification', completed: false },
        { id: '4', label: 'Defect identification and marking', completed: false },
        { id: '5', label: 'Quality approval documentation', completed: false }
      ],
      'finishing': [
        { id: '1', label: 'Cutting and trimming', completed: false },
        { id: '2', label: 'Folding and binding', completed: false },
        { id: '3', label: 'Packaging preparation', completed: false },
        { id: '4', label: 'Final quality check', completed: false },
        { id: '5', label: 'Ready for delivery', completed: false }
      ]
    };

    return checklists[stage] || [];
  }

  getChecklistProgress(activity: JobStageActivity): { completed: number; total: number; percentage: number } {
    if (this.progressCache.has(activity)) {
      return this.progressCache.get(activity)!;
    }
    const checklist = this.getChecklistItems(activity);
    const completed = checklist.filter(item => item.completed).length;
    const total = checklist.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const progress = { completed, total, percentage };
    this.progressCache.set(activity, progress);
    return progress;
  }

  toggleChecklistItem(activity: JobStageActivity, item: ChecklistItem): void {
    // Don't allow toggling if stage is completed
    if (activity.status === 'completed') {
      return;
    }
    
    // Toggle the completed state
    item.completed = !item.completed;
    
    // Update completed_at timestamp
    if (item.completed) {
      item.completed_at = new Date().toISOString();
    } else {
      item.completed_at = undefined;
    }
    
    // Update the cache to reflect the change
    const checklist = this.getChecklistItems(activity);
    const completed = checklist.filter(i => i.completed).length;
    const total = checklist.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.progressCache.set(activity, { completed, total, percentage });
  }

  onUpdate(activity: JobStageActivity): void {
    // Handle update action
    console.log('Update clicked for stage:', activity.stage_label);
    // TODO: Implement update logic
  }

  onCancel(activity: JobStageActivity): void {
    // Emit cancel event to close modal
    this.cancel.emit();
  }
}

