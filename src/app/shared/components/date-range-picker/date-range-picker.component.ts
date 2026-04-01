import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, IconComponent],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() fromDate: Date | null = null;
  @Input() toDate: Date | null = null;
  @Input() placeholder: string = 'Select date range';
  @Input() format: string = 'MMM dd, yyyy';
  @Input() disabled: boolean = false;
  @Output() dateRangeChange = new EventEmitter<{ fromDate: Date | null; toDate: Date | null }>();

  isOpen: boolean = false;
  currentMonth: Date = new Date();
  secondMonth: Date = new Date();
  selectingStart: boolean = true;
  tempFromDate: Date | null = null;
  tempToDate: Date | null = null;
  displayValue: string = '';
  selectedPreset: string | null = null;
  inputWidth: number = 120;
  private lastDisplayValue: string = '';
  private isCalculatingWidth: boolean = false;
  
  @ViewChild('measureSpan', { static: false }) measureSpan!: ElementRef<HTMLSpanElement>;
  
  get isSingleDate(): boolean {
    return (!!this.fromDate && !this.toDate) || 
           (!!this.fromDate && !!this.toDate && this.fromDate.getTime() === this.toDate.getTime());
  }

  ngOnInit(): void {
    this.tempFromDate = this.fromDate;
    this.tempToDate = this.toDate;
    this.updateDisplayValue();
    this.initializeMonths();
    // Calculate initial width after view init
    setTimeout(() => {
      requestAnimationFrame(() => {
        this.updateInputWidth();
      });
    }, 0);
  }

  private initializeMonths(): void {
    if (this.fromDate) {
      this.currentMonth = new Date(this.fromDate.getFullYear(), this.fromDate.getMonth(), 1);
    } else if (this.toDate) {
      this.currentMonth = new Date(this.toDate.getFullYear(), this.toDate.getMonth(), 1);
    } else {
      this.currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
    // Set second month to next month
    this.secondMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fromDate'] || changes['toDate']) {
      this.tempFromDate = this.fromDate;
      this.tempToDate = this.toDate;
      this.updateDisplayValue();
    }
  }

  toggleCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.selectingStart = true;
        this.tempFromDate = this.fromDate;
        this.tempToDate = this.toDate;
        this.initializeMonths();
        this.checkPresetSelection();
      }
    }
  }

  closeCalendar(): void {
    this.isOpen = false;
  }

  selectDate(date: Date): void {
    if (this.selectingStart) {
      this.tempFromDate = date;
      this.tempToDate = null;
      this.selectingStart = false;
      this.selectedPreset = null;
    } else {
      if (this.tempFromDate && date < this.tempFromDate) {
        // If end date is before start date, swap them
        this.tempToDate = this.tempFromDate;
        this.tempFromDate = date;
      } else {
        this.tempToDate = date;
      }
      this.selectedPreset = null;
      // Auto-apply if both dates are selected, or allow single date selection
    }
  }

  applyRange(): void {
    // Allow single date selection - if only fromDate is selected, use it for both
    this.fromDate = this.tempFromDate;
    this.toDate = this.tempToDate || this.tempFromDate; // Use fromDate as toDate if only single date selected
    this.updateDisplayValue();
    this.dateRangeChange.emit({ fromDate: this.fromDate, toDate: this.toDate });
    this.closeCalendar();
  }

  cancelSelection(): void {
    this.tempFromDate = this.fromDate;
    this.tempToDate = this.toDate;
    this.selectingStart = true;
    this.selectedPreset = null;
    this.closeCalendar();
  }

  clearRange(): void {
    this.tempFromDate = null;
    this.tempToDate = null;
    this.fromDate = null;
    this.toDate = null;
    this.displayValue = '';
    this.dateRangeChange.emit({ fromDate: null, toDate: null });
  }

  navigateMonth(direction: number, monthIndex: number = 0): void {
    if (monthIndex === 0) {
      this.currentMonth = new Date(
        this.currentMonth.getFullYear(),
        this.currentMonth.getMonth() + direction,
        1
      );
      // Keep second month as next month
      this.secondMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    } else {
      this.secondMonth = new Date(
        this.secondMonth.getFullYear(),
        this.secondMonth.getMonth() + direction,
        1
      );
      // Keep first month as previous month
      this.currentMonth = new Date(this.secondMonth.getFullYear(), this.secondMonth.getMonth() - 1, 1);
    }
  }

  selectToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.tempFromDate = today;
    this.tempToDate = null;
    this.selectingStart = true;
    this.selectedPreset = null;
    // Don't auto-apply, let user click Apply button to confirm selection
  }

  private updateDisplayValue(): void {
    if (this.fromDate && this.toDate) {
      // If both dates are the same, show single date
      if (this.fromDate.getTime() === this.toDate.getTime()) {
        this.displayValue = this.formatDate(this.fromDate);
      } else {
        this.displayValue = `${this.formatDate(this.fromDate)} - ${this.formatDate(this.toDate)}`;
      }
    } else if (this.fromDate) {
      this.displayValue = this.formatDate(this.fromDate);
    } else if (this.toDate) {
      this.displayValue = this.formatDate(this.toDate);
    } else {
      this.displayValue = '';
    }
    // Update width after display value changes
    setTimeout(() => {
      requestAnimationFrame(() => {
        this.updateInputWidth();
      });
    }, 0);
  }

  ngAfterViewChecked(): void {
    // Only recalculate if displayValue changed
    if (this.displayValue !== this.lastDisplayValue && !this.isCalculatingWidth) {
      this.lastDisplayValue = this.displayValue;
      requestAnimationFrame(() => {
        this.updateInputWidth();
      });
    }
  }

  private updateInputWidth(): void {
    if (this.isCalculatingWidth) {
      return; // Prevent recursive calls
    }
    
    if (this.measureSpan?.nativeElement) {
      this.isCalculatingWidth = true;
      
      // Get the internal content width (text only, no padding)
      // Use scrollWidth for more accurate text measurement
      const contentWidth = this.measureSpan.nativeElement.scrollWidth || this.measureSpan.nativeElement.offsetWidth;
      
      // Add padding and icon space
      const leftPadding = 12;
      const rightPadding = 16; // 16px gap before icon
      const iconWidth = 34; // icon button width (18px icon + 16px padding)
      const totalWidth = contentWidth + leftPadding + rightPadding + iconWidth;
      
      // Determine min-width based on actual content
      // If displayValue is empty, use placeholder width
      // If it's a single date, use 120px min
      // If it's a range, use calculated width directly (no forced minimum)
      let calculatedWidth: number;
      if (!this.displayValue) {
        // Empty/placeholder - use calculated width or a reasonable default
        calculatedWidth = Math.max(150, totalWidth); // Minimum for placeholder
      } else if (this.isSingleDate) {
        // Single date - use calculated width with 120px minimum
        calculatedWidth = Math.max(120, totalWidth);
      } else {
        // Date range - use calculated width directly, no forced minimum
        calculatedWidth = totalWidth;
      }
      
      console.log('Date Range Picker Width Calculation:', {
        displayValue: this.displayValue,
        isSingleDate: this.isSingleDate,
        contentWidth: contentWidth,
        leftPadding: leftPadding,
        rightPadding: rightPadding,
        iconWidth: iconWidth,
        totalWidth: totalWidth,
        calculatedWidth: calculatedWidth,
        currentInputWidth: this.inputWidth
      });
      
      // Only update if different to avoid unnecessary change detection
      if (Math.abs(this.inputWidth - calculatedWidth) > 0.5) {
        console.log('Updating input width from', this.inputWidth, 'to', calculatedWidth);
        this.inputWidth = calculatedWidth;
      } else {
        console.log('Width unchanged, skipping update');
      }
      
      this.isCalculatingWidth = false;
    } else {
      console.log('Measure span not available');
    }
  }

  private formatDate(date: Date): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    
    // Format: MMM dd, yyyy (e.g., "Oct 20, 2020")
    if (this.format === 'MMM dd, yyyy' || this.format.includes('MMM')) {
      return `${monthNames[monthIndex]} ${day}, ${year}`;
    }
    
    // Fallback to original format for backward compatibility
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    
    return this.format
      .replace('MMM', monthNames[monthIndex])
      .replace('MM', monthStr)
      .replace('dd', dayStr)
      .replace('yyyy', year.toString());
  }

  get calendarDays(): Date[] {
    return this.getCalendarDaysForMonth(this.currentMonth);
  }

  get secondCalendarDays(): Date[] {
    return this.getCalendarDaysForMonth(this.secondMonth);
  }

  private getCalendarDaysForMonth(month: Date): Date[] {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
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

  get secondMonthName(): string {
    return this.monthNames[this.secondMonth.getMonth()];
  }

  get secondYear(): number {
    return this.secondMonth.getFullYear();
  }

  isCurrentMonth(date: Date, month: Date): boolean {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  }

  isDateInRange(date: Date): boolean {
    if (!this.tempFromDate || !this.tempToDate) return false;
    const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const fromTime = new Date(this.tempFromDate.getFullYear(), this.tempFromDate.getMonth(), this.tempFromDate.getDate()).getTime();
    const toTime = new Date(this.tempToDate.getFullYear(), this.tempToDate.getMonth(), this.tempToDate.getDate()).getTime();
    return dateTime >= fromTime && dateTime <= toTime;
  }

  isDateStart(date: Date): boolean {
    if (!this.tempFromDate) return false;
    const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const fromTime = new Date(this.tempFromDate.getFullYear(), this.tempFromDate.getMonth(), this.tempFromDate.getDate()).getTime();
    return dateTime === fromTime;
  }

  isDateEnd(date: Date): boolean {
    if (!this.tempToDate) return false;
    const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const toTime = new Date(this.tempToDate.getFullYear(), this.tempToDate.getMonth(), this.tempToDate.getDate()).getTime();
    return dateTime === toTime;
  }

  selectPreset(preset: string): void {
    this.selectedPreset = preset;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case 'today':
        from = new Date(today);
        to = new Date(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        from = yesterday;
        to = yesterday;
        break;
      case 'this7days':
        from = new Date(today);
        from.setDate(from.getDate() - 6);
        to = new Date(today);
        break;
      case 'last30days':
        from = new Date(today);
        from.setDate(from.getDate() - 29);
        to = new Date(today);
        break;
      case 'last3months':
        from = new Date(today);
        from.setMonth(from.getMonth() - 3);
        from.setDate(1);
        to = new Date(today);
        break;
      case 'thisyear':
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today);
        break;
      case 'lastyear':
        from = new Date(today.getFullYear() - 1, 0, 1);
        to = new Date(today.getFullYear() - 1, 11, 31);
        break;
    }

    this.tempFromDate = from;
    this.tempToDate = to;
    this.selectingStart = true;
    if (from && to) {
      this.currentMonth = new Date(from.getFullYear(), from.getMonth(), 1);
      this.secondMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    }
  }

  checkPresetSelection(): void {
    if (!this.fromDate || !this.toDate) {
      this.selectedPreset = null;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(this.fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(this.toDate);
    to.setHours(0, 0, 0, 0);

    // Check each preset
    if (from.getTime() === to.getTime() && from.getTime() === today.getTime()) {
      this.selectedPreset = 'today';
    } else if (from.getTime() === to.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (from.getTime() === yesterday.getTime()) {
        this.selectedPreset = 'yesterday';
      } else {
        this.selectedPreset = null;
      }
    } else {
      // Check other presets based on date ranges
      this.selectedPreset = null;
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

}

