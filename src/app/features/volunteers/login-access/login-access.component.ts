import { Component,  OnInit, inject } from '@angular/core';
import { HlmSelectComponent, DropdownOption } from '../../../shared/ui';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../data.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { HlmButtonDirective, HlmInputDirective, HlmLabelDirective } from '../../../shared/ui';

export interface LoginAccess {
  password: string;
  users: [];
}

@Component({
  selector: 'app-login-access',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmSelectComponent, IconComponent, HlmButtonDirective, HlmInputDirective, HlmLabelDirective],
  templateUrl: './login-access.component.html',
  host: { class: 'block w-full h-full overflow-y-auto bg-muted/40' }
})

export class LoginAccessComponent implements OnInit {
  private dataService = inject(DataService);
  private snackbarService = inject(SnackbarService);

  activeTab: 'provide' | 'deactivate' = 'provide';
  isLoading = false;
  password = '';
  showPassword = false;
  assignLoginUsersOptions: DropdownOption[] = [];
  selectedLoginUsers: any[] = [];
  isLoadingLoginUsers = false;

  // Deactivate Login Access
  isDeactivating = false;
  deactivateUsersOptions: DropdownOption[] = [];
  selectedDeactivateUsers: any[] = [];
  isLoadingDeactivateUsers = false;

  ngOnInit(): void {
    this.loadLoginUsersOptions();
    this.loadDeactivateUsersOptions();
  }

  get isFormValid(): boolean {
    return !!(
      this.password &&
      this.selectedLoginUsers.length > 0
    );
  }

  onSubmit(): void {
    if (!this.isFormValid) {
      this.snackbarService.showError('Please fill in all required fields.');
      return;
    }

    const body = {
      user_ids: this.selectedLoginUsers.map(v => String(v)),
      password: this.password
    };

    this.isLoading = true;
    this.dataService.put<any>('v1/users/update-password', body).pipe(
      catchError((err) => {
        this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to update password.');
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe((response) => {
      if (response === null) return;
      this.snackbarService.showSuccess(response?.message || 'Login access provided successfully!');
      this.onReset();
    });
  }


  onReset(): void {
    this.password = '';
    this.selectedLoginUsers = [];
    this.showPassword = false;
  }

  getSelectedLoginUsersOptions(): DropdownOption[] {
    return this.assignLoginUsersOptions.filter(o => this.selectedLoginUsers.includes(o.value));
  }

  removeLoginUsers(value: any): void {
    this.selectedLoginUsers = this.selectedLoginUsers.filter(v => v !== value);
  }

  onDeactivate(): void {
    if (!this.selectedDeactivateUsers.length) {
      this.snackbarService.showError('Please select at least one user to deactivate.');
      return;
    }

    const body = {
      user_ids: this.selectedDeactivateUsers.map(v => String(v))
    };

    this.isDeactivating = true;
    this.dataService.put<any>('v1/users/deactivate-special-login-sewa-account', body).pipe(
      catchError((err) => {
        this.snackbarService.showError(err?.error?.message || err?.message || 'Failed to deactivate login access.');
        return of(null);
      }),
      finalize(() => this.isDeactivating = false)
    ).subscribe((response) => {
      if (response === null) return;
      this.snackbarService.showSuccess(response?.message || 'Login access deactivated successfully!');
      this.onDeactivateReset();
    });
  }

  onDeactivateReset(): void {
    this.selectedDeactivateUsers = [];
  }

  getSelectedDeactivateUsersOptions(): DropdownOption[] {
    return this.deactivateUsersOptions.filter(o => this.selectedDeactivateUsers.includes(o.value));
  }

  removeDeactivateUsers(value: any): void {
    this.selectedDeactivateUsers = this.selectedDeactivateUsers.filter(v => v !== value);
  }

private loadLoginUsersOptions(): void {
  this.isLoadingLoginUsers = true;

  this.dataService.get<any>(`v1/options/sewa_login_users`).pipe(
    catchError(() => {
      this.isLoadingLoginUsers = false; // Turn off loader on error
      return of({ data: [] });
    })
  ).subscribe((response) => {
    if (response?.success && Array.isArray(response.data)) {
      this.assignLoginUsersOptions = response.data.map((user: any) => ({
        id: String(user.id),
        label: user.name,
        value: String(user.id)
      }));
    } else   {
      this.assignLoginUsersOptions = [];
    }

    this.isLoadingLoginUsers = false; // Turn off loader after success
  });
}

private loadDeactivateUsersOptions(): void {
  this.isLoadingDeactivateUsers = true;

  this.dataService.get<any>(`v1/options/sewa_login_users`).pipe(
    catchError(() => {
      this.isLoadingDeactivateUsers = false;
      return of({ data: [] });
    })
  ).subscribe((response) => {
    if (response?.success && Array.isArray(response.data)) {
      this.deactivateUsersOptions = response.data.map((user: any) => ({
        id: String(user.id),
        label: user.name,
        value: String(user.id)
      }));
    } else {
      this.deactivateUsersOptions = [];
    }
    this.isLoadingDeactivateUsers = false;
  });
}

}
