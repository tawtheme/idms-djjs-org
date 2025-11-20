import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';
import { SnackbarComponent, SnackbarConfig } from '../../../shared/components/snackbar/snackbar.component';

interface LoginActivity {
  id: string;
  loginTime: string;
  logoutTime: string | null;
  status: string;
  ipAddress: string;
  sessionDuration: string | null;
}

interface UserDetail {
  userId: string;
  email: string;
  name: string;
  loginActivity: LoginActivity[];
}

interface UserDetailResponse {
  userDetails: UserDetail[];
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  created_at: string;
  last_login: string;
  avatar: string | null;
}

@Component({
  standalone: true,
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  imports: [CommonModule, SnackbarComponent]
})
export class UserDetailComponent implements OnInit, OnChanges {
  @Input() userId: string | null = null;
  
  loading = false;
  user: User | null = null;
  userDetail: UserDetail | null = null;
  loginActivity: LoginActivity[] = [];
  snackbarConfig: SnackbarConfig | null = null;

  constructor(private data: DataService) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loadUserData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange && this.userId) {
      this.loadUserData();
    }
  }

  loadUserData(): void {
    if (!this.userId) return;

    this.loading = true;

    // Load user basic info
    this.data.getJson<any>('users.json').subscribe((userResponse) => {
      const users = userResponse?.users ?? [];
      this.user = users.find((u: any) => u.id === this.userId) || null;

      // Load user details with login activity
      this.data.getJson<UserDetailResponse>('user-details.json').subscribe((detailResponse) => {
        const userDetails = detailResponse?.userDetails ?? [];
        this.userDetail = userDetails.find((ud: UserDetail) => ud.userId === this.userId) || null;
        this.loginActivity = this.userDetail?.loginActivity || [];
        this.loading = false;
      });
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'success' || statusLower === 'active') {
      return 'status-success';
    } else if (statusLower === 'inactive') {
      return 'status-inactive';
    }
    return 'status-failed';
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.showSnackbar('Copied to clipboard!', 'success');
    }).catch(() => {
      this.showSnackbar('Failed to copy to clipboard', 'error');
    });
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
    this.snackbarConfig = {
      message,
      type,
      duration: 3000
    };
    setTimeout(() => {
      this.snackbarConfig = null;
    }, 3000);
  }

  trackByActivityId(_: number, activity: LoginActivity): string {
    return activity.id;
  }
}

