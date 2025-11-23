import { Injectable, ComponentRef, ViewContainerRef, inject, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { SnackbarComponent, SnackbarConfig } from '../components/snackbar/snackbar.component';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private snackbarRefs: ComponentRef<SnackbarComponent>[] = [];

  /**
   * Shows a snackbar message
   * @param message - The message to display
   * @param type - The type of snackbar (success, error, warning, info)
   * @param duration - Duration in milliseconds (default: 4000)
   */
  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000): void {
    const config: SnackbarConfig = {
      message,
      type,
      duration
    };

    this.createSnackbar(config);
  }

  /**
   * Shows an error snackbar
   * @param message - Error message to display
   * @param duration - Duration in milliseconds (default: 5000)
   */
  showError(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Shows a success snackbar
   * @param message - Success message to display
   * @param duration - Duration in milliseconds (default: 4000)
   */
  showSuccess(message: string, duration: number = 4000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Shows a warning snackbar
   * @param message - Warning message to display
   * @param duration - Duration in milliseconds (default: 4000)
   */
  showWarning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Shows an info snackbar
   * @param message - Info message to display
   * @param duration - Duration in milliseconds (default: 4000)
   */
  showInfo(message: string, duration: number = 4000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Creates and displays a snackbar component
   * @param config - Snackbar configuration
   */
  private createSnackbar(config: SnackbarConfig): void {
    // Get the root view container
    const rootComponent = this.appRef.components[0];
    if (!rootComponent) {
      return;
    }

    // Create snackbar component
    const snackbarRef = createComponent(SnackbarComponent, {
      environmentInjector: this.injector
    });

    snackbarRef.instance.config = config;

    // Attach to DOM
    const rootElement = rootComponent.location.nativeElement;
    rootElement.appendChild(snackbarRef.location.nativeElement);

    // Register for change detection
    this.appRef.attachView(snackbarRef.hostView);

    // Trigger change detection
    snackbarRef.changeDetectorRef.detectChanges();

    // Store reference
    this.snackbarRefs.push(snackbarRef);

    // Clean up after duration
    const duration = config.duration || 4000;
    setTimeout(() => {
      this.removeSnackbar(snackbarRef);
    }, duration);
  }

  /**
   * Removes a snackbar from the DOM
   * @param snackbarRef - Reference to the snackbar component
   */
  private removeSnackbar(snackbarRef: ComponentRef<SnackbarComponent>): void {
    const index = this.snackbarRefs.indexOf(snackbarRef);
    if (index > -1) {
      this.snackbarRefs.splice(index, 1);
    }

    // Detach from change detection
    this.appRef.detachView(snackbarRef.hostView);

    // Remove from DOM
    snackbarRef.destroy();
  }
}

