import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { observeOn } from 'rxjs/operators';
import { asyncScheduler } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  // Emit asynchronously so subscribers in active change-detection cycles
  // don't trigger ExpressionChangedAfterItHasBeenCheckedError.
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable().pipe(observeOn(asyncScheduler));

  start(): void {
    this.pending++;
    if (this.pending === 1) this.loadingSubject.next(true);
  }

  stop(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0) this.loadingSubject.next(false);
  }

  reset(): void {
    this.pending = 0;
    this.loadingSubject.next(false);
  }
}
