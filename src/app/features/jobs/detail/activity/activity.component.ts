import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActivityLogItem {
  date: string;
  action: string;
  user: string;
  stage?: string;
}

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnChanges {
  @Input() activities: ActivityLogItem[] = [];
  @Input() title: string = 'Activity Log';
  @Input() showTitle: boolean = true;
  
  displayedCount: number = 3;
  readonly initialDisplayCount: number = 3;

  ngOnChanges(changes: SimpleChanges): void {
    // Reset displayed count when activities change
    if (changes['activities'] && !changes['activities'].firstChange) {
      this.displayedCount = this.initialDisplayCount;
    }
  }

  get displayedActivities(): ActivityLogItem[] {
    return this.activities.slice(0, this.displayedCount);
  }

  get hasMoreActivities(): boolean {
    return this.activities.length > this.displayedCount;
  }

  loadMore(): void {
    // Show 5 more activities, or all remaining if less than 5
    const remaining = this.activities.length - this.displayedCount;
    this.displayedCount += Math.min(5, remaining);
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

  getStageLabel(stageKey: string | undefined): string {
    if (!stageKey) {
      return '';
    }

    const stageLabels: { [key: string]: string } = {
      'production_manager': 'Production Manager',
      'per_press': 'Per Press Department',
      'press_dept': 'Press Department',
      'qa': 'QA Department',
      'finishing': 'Finishing Department'
    };

    return stageLabels[stageKey] || stageKey;
  }

  hasActivities(): boolean {
    return this.activities && this.activities.length > 0;
  }
}

