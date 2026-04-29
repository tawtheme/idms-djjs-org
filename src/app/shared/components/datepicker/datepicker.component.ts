import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

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
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss']
})
export class DatepickerComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('calendarElement') calendarElement!: ElementRef<HTMLDivElement>;
  
  constructor(private elementRef: ElementRef) {}
  
  @Input() value: Date | null = null;
  @Input() placeholder: string = 'Select Date';
  @Input() format: string = 'MM/dd/yyyy';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() initialViewDate: Date | null = null;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() showToday: boolean = true;
  @Input() showClear: boolean = true;
  @Input() showWeekNumbers: boolean = false;
  @Output() dateChange = new EventEmitter<Date | null>();
  @Output() dateSelect = new EventEmitter<Date>();

  isOpen: boolean = false;
  openUpward: boolean = false;
  currentMonth: Date = new Date();
  selectedDate: Date | null = null;
  displayValue: string = '';
  viewMode: 'days' | 'months' | 'years' = 'days';
  yearPageStart: number = 0;

  ngOnInit(): void {
    this.selectedDate = this.value;
    this.updateDisplayValue();
    this.currentMonth = this.value ? new Date(this.value) : (this.initialViewDate ? new Date(this.initialViewDate) : new Date());
  }

  ngAfterViewInit(): void {
    // View initialized
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.selectedDate = this.value;
      this.updateDisplayValue();
    }
    if (changes['initialViewDate'] && !this.value && this.initialViewDate && !this.isOpen) {
      this.currentMonth = new Date(this.initialViewDate);
    }
  }

  toggleCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    // Allow opening even when input is readonly; readonly only blocks typing
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.viewMode = 'days';
        // Check available space after a short delay to ensure calendar is rendered
        setTimeout(() => {
          this.checkAvailableSpace();
        }, 0);
      }
    }
  }

  openCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.disabled || this.isOpen) return;
    this.isOpen = true;
    this.viewMode = 'days';
    setTimeout(() => this.checkAvailableSpace(), 0);
  }

  private checkAvailableSpace(): void {
    let calendar: HTMLElement | null = null;
    let trigger: HTMLElement | null = null;

    if (this.calendarElement?.nativeElement) {
      calendar = this.calendarElement.nativeElement;
      const wrapper = calendar.closest('.datepicker-wrapper');
      if (wrapper) {
        trigger = wrapper.querySelector('.datepicker-input-container') as HTMLElement;
      }
    } else {
      // Fallback: query DOM directly
      const wrapper = this.elementRef?.nativeElement?.closest('.datepicker-wrapper') || 
                      document.querySelector('.datepicker-wrapper');
      if (!wrapper) return;
      
      calendar = wrapper.querySelector('.datepicker-calendar') as HTMLElement;
      trigger = wrapper.querySelector('.datepicker-input-container') as HTMLElement;
    }

    if (!calendar || !trigger) {
      // Retry after a short delay if elements not found yet
      setTimeout(() => {
        if (this.isOpen) {
          this.checkAvailableSpace();
        }
      }, 50);
      return;
    }
    
    this.calculatePosition(calendar, trigger);
  }

  private calculatePosition(calendar: HTMLElement, trigger: HTMLElement): void {
    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Get actual calendar height if available, otherwise use estimate
    const calendarRect = calendar.getBoundingClientRect();
    let calendarHeight = calendarRect.height;
    
    // If calendar not fully rendered yet, use a more accurate estimate
    if (calendarHeight < 10) {
      // Standard calendar with header, grid, and actions is approximately 360px
      calendarHeight = 360;
    }
    
    const margin = 8;
    const requiredSpace = calendarHeight + margin;
    
    // Calculate available space below and above
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    // Open upward if there's not enough space below
    const threshold = 200; // If less than 200px below, prefer opening upward
    
    // Open upward if:
    // 1. Not enough space below for the calendar, OR
    // 2. Space below is less than threshold AND there's enough space above
    this.openUpward = spaceBelow < requiredSpace || (spaceBelow < threshold && spaceAbove >= requiredSpace);
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

  navigate(direction: number): void {
    if (this.viewMode === 'days') {
      this.navigateMonth(direction);
    } else if (this.viewMode === 'months') {
      this.currentMonth = new Date(
        this.currentMonth.getFullYear() + direction,
        this.currentMonth.getMonth(),
        1
      );
    } else {
      this.yearPageStart += direction * 12;
    }
  }

  showMonthView(): void {
    this.viewMode = 'months';
  }

  showYearView(): void {
    const year = this.currentMonth.getFullYear();
    this.yearPageStart = year - (year % 12);
    this.viewMode = 'years';
  }

  selectMonth(monthIndex: number): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), monthIndex, 1);
    this.viewMode = 'days';
  }

  selectYear(year: number): void {
    this.currentMonth = new Date(year, this.currentMonth.getMonth(), 1);
    this.viewMode = 'months';
  }

  get yearGrid(): number[] {
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(this.yearPageStart + i);
    }
    return years;
  }

  get yearRangeLabel(): string {
    return `${this.yearPageStart} - ${this.yearPageStart + 11}`;
  }

  onInputType(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.displayValue = value;
  }

  onInputCommit(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (!raw) {
      this.clearDate();
      return;
    }
    const parsed = this.parseDate(raw);
    if (parsed && !this.isDateDisabled(parsed)) {
      this.selectedDate = parsed;
      this.value = parsed;
      this.currentMonth = new Date(parsed);
      this.updateDisplayValue();
      this.dateChange.emit(parsed);
    } else {
      // Revert to last valid display value
      this.updateDisplayValue();
    }
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
    }
  }

  private parseDate(input: string): Date | null {
    // Build a regex from the configured format
    const tokens: { token: string; group: 'd' | 'm' | 'y' }[] = [];
    let pattern = '';
    let i = 0;
    while (i < this.format.length) {
      if (this.format.startsWith('dd', i)) {
        pattern += '(\\d{1,2})';
        tokens.push({ token: 'dd', group: 'd' });
        i += 2;
      } else if (this.format.startsWith('MM', i)) {
        pattern += '(\\d{1,2})';
        tokens.push({ token: 'MM', group: 'm' });
        i += 2;
      } else if (this.format.startsWith('yyyy', i)) {
        pattern += '(\\d{4})';
        tokens.push({ token: 'yyyy', group: 'y' });
        i += 4;
      } else {
        pattern += this.format[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        i++;
      }
    }
    const match = new RegExp('^' + pattern + '$').exec(input);
    if (!match) return null;
    let day = 1, month = 0, year = 1970;
    tokens.forEach((t, idx) => {
      const v = parseInt(match[idx + 1], 10);
      if (t.group === 'd') day = v;
      else if (t.group === 'm') month = v - 1;
      else if (t.group === 'y') year = v;
    });
    const d = new Date(year, month, day);
    if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
      return null;
    }
    return d;
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
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const t = startOfDay(date);
    if (this.minDate && t < startOfDay(this.minDate)) return true;
    if (this.maxDate && t > startOfDay(this.maxDate)) return true;
    return false;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isInsideThisDatepicker(target: HTMLElement | null): boolean {
    if (!target) return false;
    const host = this.elementRef?.nativeElement as HTMLElement | undefined;
    return !!host && host.contains(target);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isOpen) return;
    if (!this.isInsideThisDatepicker(event.target as HTMLElement)) {
      this.closeCalendar();
    }
  }

  // Close earlier on mousedown (before other popovers open)
  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: Event): void {
    if (!this.isOpen) return;
    if (!this.isInsideThisDatepicker(event.target as HTMLElement)) {
      this.closeCalendar();
    }
  }

  // Also close when focus moves outside (e.g., via keyboard)
  @HostListener('document:focusin', ['$event'])
  onDocumentFocusIn(event: Event): void {
    if (!this.isOpen) return;
    if (!this.isInsideThisDatepicker(event.target as HTMLElement)) {
      this.closeCalendar();
    }
  }

  // Recalculate position on window resize
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.checkAvailableSpace();
    }
  }

  // Recalculate position on scroll
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen) {
      this.checkAvailableSpace();
    }
  }
}
