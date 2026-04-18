import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { DataService } from '../../../data.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-attendances',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbComponent,
    DropdownComponent
  ],
  templateUrl: './attendances.component.html',
  styleUrls: ['./attendances.component.scss']
})
export class AttendancesComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Programs', route: '/programs/programs-list' },
    { label: 'Attendances', route: '/programs/attendances' }
  ];

  selectedProgram: any[] = [];
  programOptions: DropdownOption[] = [];

  ngOnInit(): void {
    this.loadPrograms();
  }

  private loadPrograms(): void {
    this.dataService.get<any>('v1/programs/active-for-attendance?action=attendance').pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response) => {
      const data = response.data || response.results || response || [];
      this.programOptions = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: String(item.id),
        label: item.name,
        value: String(item.id)
      }));
    });
  }

  onProgramChange(values: any[]): void {
    this.selectedProgram = values;
  }

  checkIn(): void {
    if (!this.selectedProgram.length) return;
    const programId = this.selectedProgram[0];
    this.router.navigate(['/programs/attendances', programId], {
      queryParams: { mode: 'checkin' }
    });
  }

  checkOut(): void {
    if (!this.selectedProgram.length) return;
    const programId = this.selectedProgram[0];
    this.router.navigate(['/programs/attendances', programId], {
      queryParams: { mode: 'checkout' }
    });
  }
}
