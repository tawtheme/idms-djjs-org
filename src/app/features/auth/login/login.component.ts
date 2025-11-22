import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
        // Login successful - navigate to dashboard
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      },
      error: (error) => {
        // Error is already handled in AuthService, but we can add additional handling here if needed
        console.error('Login error:', error);
      }
    });
  }
}
