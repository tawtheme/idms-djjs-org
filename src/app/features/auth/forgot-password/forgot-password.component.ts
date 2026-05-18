import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HlmButtonDirective, HlmInputDirective, HlmLabelDirective } from '../../../shared/ui';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HlmButtonDirective, HlmInputDirective, HlmLabelDirective],
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email = '';
  isSubmitted = false;

  onSubmit() {
    console.log('Password reset request for:', this.email);
    this.isSubmitted = true;
    // TODO: Implement actual password reset request
  }
}
