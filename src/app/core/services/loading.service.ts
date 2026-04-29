import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private emitTimer: any = null;
  // Skip duplicate emissions; defer the visible state via setTimeout so
  // the bound value can't change inside an active change-detection cycle.
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable().pipe(distinctUntilChanged());

  start(): void {
    this.pending++;
    this.scheduleEmit();
  }

  stop(): void {
    this.pending = Math.max(0, this.pending - 1);
    this.scheduleEmit();
  }

  reset(): void {
    this.pending = 0;
    this.scheduleEmit();
  }

  private scheduleEmit(): void {
    if (this.emitTimer != null) return;
    this.emitTimer = setTimeout(() => {
      this.emitTimer = null;
      this.loadingSubject.next(this.pending > 0);
    });
  }
}
