import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  errorMessage = '';

  private auth = inject(AuthService);
  private router = inject(Router);

  get isLoading() {
    return this.auth.isLoading();
  }

  constructor() {
    // Watch error signal using effect
    effect(() => {
      const error = this.auth.error();
      this.errorMessage = error || '';
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle(): void {
    // TODO: Implement Google OAuth login
    console.log('Google login clicked');
    // In a real application, you would redirect to Google OAuth
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.errorMessage = '';
    
    this.auth.login(this.email, this.password, this.rememberMe).subscribe({
      next: (response) => {
        // VMS Users are restricted to the attendance page; everyone else goes to the dashboard.
        const target = this.auth.isVmsUser() ? '/programs/attendances' : '/dashboard';
        this.router.navigate([target], { replaceUrl: true });
      },
      error: (error) => {
        // Error is already handled in AuthService, but we can add additional handling here if needed
        console.error('Login error:', error);
      }
    });
  }
}
