import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

@Injectable({
    providedIn: 'root',
})
export class SnackbarService {
    show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000): void {
        switch (type) {
            case 'success':
                toast.success(message, { duration });
                break;
            case 'error':
                toast.error(message, { duration });
                break;
            case 'warning':
                toast.warning(message, { duration });
                break;
            default:
                toast.info(message, { duration });
        }
    }

    showError(message: string, duration: number = 5000): void {
        this.show(message, 'error', duration);
    }

    showSuccess(message: string, duration: number = 4000): void {
        this.show(message, 'success', duration);
    }

    showWarning(message: string, duration: number = 4000): void {
        this.show(message, 'warning', duration);
    }

    showInfo(message: string, duration: number = 4000): void {
        this.show(message, 'info', duration);
    }
}
