import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DatePickerConfig {
  minDate?: Date;
  maxDate?: Date;
  format: string;
  placeholder: string;
  disabled: boolean;
  readonly: boolean;
  showToday: boolean;
  showClear: boolean;
}

@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss']
})
export class DatepickerComponent implements OnInit, OnChanges {
  @Input() value: Date | null = null;
  @Input() placeholder: string = 'Select date';
  @Input() format: string = 'MM/dd/yyyy';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = true;
  @Input() showToday: boolean = true;
  @Input() showClear: boolean = true;
  @Input() showWeekNumbers: boolean = false;
  @Output() dateChange = new EventEmitter<Date | null>();
  @Output() dateSelect = new EventEmitter<Date>();

  isOpen: boolean = false;
  currentMonth: Date = new Date();
  selectedDate: Date | null = null;
  displayValue: string = '';

  ngOnInit(): void {
    this.selectedDate = this.value;
    this.updateDisplayValue();
    this.currentMonth = this.value ? new Date(this.value) : new Date();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.selectedDate = this.value;
      this.updateDisplayValue();
    }
  }

  toggleCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    // Allow opening even when input is readonly; readonly only blocks typing
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
    }
  }

  closeCalendar(): void {
    this.isOpen = false;
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
    this.value = date;
    this.updateDisplayValue();
    this.dateChange.emit(date);
    this.dateSelect.emit(date);
    this.closeCalendar();
  }

  clearDate(): void {
    this.selectedDate = null;
    this.value = null;
    this.displayValue = '';
    this.dateChange.emit(null);
  }

  selectToday(): void {
    const today = new Date();
    this.selectDate(today);
  }

  navigateMonth(direction: number): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + direction,
      1
    );
  }

  goToToday(): void {
    this.currentMonth = new Date();
  }

  private updateDisplayValue(): void {
    if (this.selectedDate) {
      this.displayValue = this.formatDate(this.selectedDate);
    } else {
      this.displayValue = '';
    }
    // Ensure placeholder shows when value is empty
    // The empty string value allows the placeholder to display
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return this.format
      .replace('MM', month)
      .replace('dd', day)
      .replace('yyyy', year.toString());
  }

  get calendarDays(): Date[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  get monthNames(): string[] {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }

  get dayNames(): string[] {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  get currentMonthName(): string {
    return this.monthNames[this.currentMonth.getMonth()];
  }

  get currentYear(): number {
    return this.currentMonth.getFullYear();
  }

  isDateSelected(date: Date): boolean {
    if (!this.selectedDate) return false;
    return date.toDateString() === this.selectedDate.toDateString();
  }

  isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) return true;
    if (this.maxDate && date > this.maxDate) return true;
    return false;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isOpen) {
      const target = event.target as HTMLElement;
      const datepickerElement = target.closest('.datepicker-wrapper');
      if (!datepickerElement) {
        this.closeCalendar();
      }
    }
  }

  // Close earlier on mousedown (before other popovers open)
  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: Event): void {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    const inside = !!target.closest('.datepicker-wrapper');
    if (!inside) this.closeCalendar();
  }

  // Also close when focus moves outside (e.g., via keyboard)
  @HostListener('document:focusin', ['$event'])
  onDocumentFocusIn(event: Event): void {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    const inside = !!target.closest('.datepicker-wrapper');
    if (!inside) this.closeCalendar();
  }
}
