import { Component,  OnInit, inject } from '@angular/core';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../data.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface LoginAccess {
  password: string;
  users: [];
}

@Component({
  selector: 'app-login-access',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent,IconComponent],
  templateUrl: './login-access.component.html',
  styleUrl: './login-access.component.scss'
})

export class LoginAccessComponent implements OnInit {
  private dataService = inject(DataService);
  private snackbarService = inject(SnackbarService);

  isLoading = false;
  password = '';
  assignLoginUsersOptions: DropdownOption[] = [];
  selectedLoginUsers: any[] = [];
  isLoadingLoginUsers = false;

  ngOnInit(): void {
    this.loadLoginUsersOptions();
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
    this.snackbarService.showSuccess('Login access provided successfully!');
  }


  onReset(): void {
    this.password = '';
    this.selectedLoginUsers = [];
  }

  getSelectedLoginUsersOptions(): DropdownOption[] {
    return this.assignLoginUsersOptions.filter(o => this.selectedLoginUsers.includes(o.value));
  }
    
  removeLoginUsers(value: any): void {
    this.selectedLoginUsers = this.selectedLoginUsers.filter(v => v !== value);
  }

private loadLoginUsersOptions(): void {
  this.isLoadingLoginUsers = true;

  this.dataService.get<any>(`v1/options/sewa_login_users`).pipe(
    catchError(() => {
      this.isLoadingLoginUsers = false; // Turn off loader on error
      return of({ data: [] });
    })
  ).subscribe((response) => {
    console.log('Login Users Response:', response);

    // 2. Map the array of data to your desired```

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

}



