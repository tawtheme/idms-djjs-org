import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface DropdownOption {
  id: string;
  label: string;
  value: any;
  disabled?: boolean;
  group?: string;
  icon?: string;
  description?: string;
}

export interface DropdownConfig {
  searchable: boolean;
  multiSelect: boolean;
  placeholder: string;
  noResultsText: string;
  maxHeight: number;
  showClear: boolean;
  showSelectAll: boolean;
  closeOnSelect: boolean;
  disabled: boolean;
  loading: boolean;
  showSelectedItems: boolean;
  selectedItemsPosition: 'below' | 'above' | 'inline';
  maxSelectedItemsDisplay: number;
  selectedItemsStyle: 'chips' | 'list' | 'compact';
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropdownList') dropdownList!: ElementRef<HTMLDivElement>;

  @Input() options: DropdownOption[] = [];
  @Input() selectedValues: any[] = [];
  @Input() config: Partial<DropdownConfig> = {};
  @Input() placeholder: string = 'Select an option';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() searchable: boolean = false;
  @Input() multiSelect: boolean = false;
  @Input() showClear: boolean = true;
  @Input() showSelectAll: boolean = false;
  @Input() closeOnSelect: boolean = true;
  @Input() maxHeight: number = 200;
  @Input() noResultsText: string = 'No results found';
  @Input() minSelections: number = 0;
  @Input() showSelectedItems: boolean = true;
  @Input() selectedItemsPosition: 'below' | 'above' | 'inline' = 'below';
  @Input() maxSelectedItemsDisplay: number = 10;
  @Input() selectedItemsStyle: 'chips' | 'list' | 'compact' = 'chips';
  // Opening behavior: auto (default), up, down
  @Input() openDirection: 'auto' | 'up' | 'down' = 'auto';

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() open = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  isOpen: boolean = false;
  searchQuery: string = '';
  filteredOptions: DropdownOption[] = [];
  selectedOptions: DropdownOption[] = [];
  allSelected: boolean = false;
  partialSelected: boolean = false;

  // Positioning properties
  openUpward: boolean = false;
  private scrollListener?: () => void;
  private ignoreNextClick: boolean = false;

  private defaultConfig: DropdownConfig = {
    searchable: false,
    multiSelect: false,
    placeholder: 'Select an option',
    noResultsText: 'No results found',
    maxHeight: 200,
    showClear: true,
    showSelectAll: false,
    closeOnSelect: true,
    disabled: false,
    loading: false,
    showSelectedItems: true,
    selectedItemsPosition: 'below',
    maxSelectedItemsDisplay: 10,
    selectedItemsStyle: 'chips'
  };

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['selectedValues'] || changes['config'] ||
      changes['searchable'] || changes['multiSelect'] || changes['placeholder'] ||
      changes['noResultsText'] || changes['maxHeight'] || changes['showClear'] ||
      changes['showSelectAll'] || changes['closeOnSelect'] || changes['disabled'] ||
      changes['loading']) {
      this.initializeComponent();
    }
  }

  ngOnDestroy(): void {
    this.removeScrollListeners();
    // Ensure dropdown is closed and cleaned up
    if (this.isOpen) {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Ignore click if we just toggled a checkbox
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false;
      return;
    }
    
    const target = event.target as HTMLElement;
    
    // Don't close if clicking on checkbox or label (for multi-select)
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    if (target.tagName === 'LABEL' || target.closest('label')) {
      return;
    }
    
    // Check if click is inside dropdown (including portaled dropdown)
    const clickedInsideTrigger = this.elementRef.nativeElement.contains(target);
    const dropdownElement = this.dropdownList?.nativeElement;
    const clickedInsideDropdown = dropdownElement?.contains(target) || 
                                  (dropdownElement?.parentElement === document.body && 
                                   document.body.contains(target) && 
                                   target.closest('.dropdown-list') === dropdownElement);
    
    if (!clickedInsideTrigger && !clickedInsideDropdown) {
      this.closeDropdown();
    }
  }

  // Close immediately on mousedown (before another popover opens)
  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: Event): void {
    if (!this.isOpen) return;
    
    // Ignore mousedown if we just toggled a checkbox
    if (this.ignoreNextClick) {
      return;
    }
    
    const target = event.target as HTMLElement;
    
    // Don't close if clicking on checkbox or label (for multi-select)
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    if (target.tagName === 'LABEL' || target.closest('label')) {
      return;
    }
    
    // Check if click is inside dropdown (including portaled dropdown)
    const clickedInsideTrigger = this.elementRef.nativeElement.contains(target);
    const dropdownElement = this.dropdownList?.nativeElement;
    const clickedInsideDropdown = dropdownElement?.contains(target) || 
                                  (dropdownElement?.parentElement === document.body && 
                                   document.body.contains(target) && 
                                   target.closest('.dropdown-list') === dropdownElement);
    
    if (!clickedInsideTrigger && !clickedInsideDropdown) {
      this.closeDropdown();
    }
  }

  // Close on focus moving outside (keyboard navigation)
  @HostListener('document:focusin', ['$event'])
  onDocumentFocusIn(event: Event): void {
    if (!this.isOpen) return;
    const target = event.target as Node;
    const inside = this.elementRef.nativeElement.contains(target) || this.dropdownList?.nativeElement?.contains(target);
    if (!inside) {
      this.closeDropdown();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.checkAvailableSpace();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.isOpen) {
      this.checkAvailableSpace();
    }
  }

  private checkAvailableSpace(): void {
    if (!this.dropdownList?.nativeElement) {
      return;
    }

    const trigger = this.elementRef.nativeElement.querySelector('.dropdown-trigger') as HTMLElement;
    if (!trigger) return;

    const dropdown = this.dropdownList.nativeElement;
    this.calculatePosition(dropdown, trigger);
  }

  private calculatePosition(dropdown: HTMLElement, trigger: HTMLElement): void {
    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Get dropdown height or use maxHeight as estimate
    const dropdownRect = dropdown.getBoundingClientRect();
    let dropdownHeight = dropdownRect.height;
    
    // If dropdown not fully rendered, use maxHeight as estimate
    if (dropdownHeight < 10) {
      dropdownHeight = Math.min(this.maxHeight, 300);
    }
    
    const margin = 8;
    const requiredSpace = dropdownHeight + margin;
    
    // Calculate available space below and above
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    // Honor explicit openDirection overrides
    if (this.openDirection === 'up') {
      this.openUpward = true;
    } else if (this.openDirection === 'down') {
      this.openUpward = false;
    } else {
      // Auto: Open upward if there's not enough space below
      const threshold = 200; // If less than 200px below, prefer opening upward
      
      // Open upward if:
      // 1. Not enough space below for the dropdown, OR
      // 2. Space below is less than threshold AND there's enough space above
      this.openUpward = spaceBelow < requiredSpace || (spaceBelow < threshold && spaceAbove >= requiredSpace);
    }
  }

  private removeScrollListeners(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener, true);
      document.removeEventListener('scroll', this.scrollListener, true);
      this.scrollListener = undefined;
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.openDropdown();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.closeDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousOption();
        break;
      case 'Enter':
        event.preventDefault();
        this.selectFocusedOption();
        break;
    }
  }

  private initializeComponent(): void {
    const mergedConfig = { ...this.defaultConfig, ...this.config };

    // Priority: Input values > Config values > Default values
    this.searchable = this.searchable !== undefined ? this.searchable : mergedConfig.searchable;
    this.multiSelect = this.multiSelect !== undefined ? this.multiSelect : mergedConfig.multiSelect;
    this.placeholder = this.placeholder !== undefined ? this.placeholder : mergedConfig.placeholder;
    this.noResultsText = this.noResultsText || mergedConfig.noResultsText;
    this.maxHeight = this.maxHeight !== undefined ? this.maxHeight : mergedConfig.maxHeight;
    this.showClear = this.showClear !== undefined ? this.showClear : mergedConfig.showClear;
    this.showSelectAll = this.showSelectAll !== undefined ? this.showSelectAll : mergedConfig.showSelectAll;
    this.closeOnSelect = this.closeOnSelect !== undefined ? this.closeOnSelect : mergedConfig.closeOnSelect;
    this.disabled = this.disabled !== undefined ? this.disabled : mergedConfig.disabled;
    this.loading = this.loading !== undefined ? this.loading : mergedConfig.loading;
    this.showSelectedItems = this.showSelectedItems !== undefined ? this.showSelectedItems : mergedConfig.showSelectedItems;
    this.selectedItemsPosition = this.selectedItemsPosition !== undefined ? this.selectedItemsPosition : mergedConfig.selectedItemsPosition;
    this.maxSelectedItemsDisplay = this.maxSelectedItemsDisplay !== undefined ? this.maxSelectedItemsDisplay : mergedConfig.maxSelectedItemsDisplay;
    this.selectedItemsStyle = this.selectedItemsStyle !== undefined ? this.selectedItemsStyle : mergedConfig.selectedItemsStyle;

    this.filteredOptions = [...this.options];
    this.updateSelectedOptions();
    this.updateSelectionState();
  }

  private updateSelectedOptions(): void {
    this.selectedOptions = this.options.filter(option =>
      this.selectedValues.includes(option.value)
    );
  }

  private updateSelectionState(): void {
    if (!this.multiSelect) return;

    const totalOptions = this.filteredOptions.length;
    const selectedCount = this.selectedOptions.length;

    this.allSelected = selectedCount === totalOptions && totalOptions > 0;
    this.partialSelected = selectedCount > 0 && selectedCount < totalOptions;
  }

  toggleDropdown(): void {
    if (this.disabled || this.loading) return;

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    if (this.disabled || this.loading) return;

    this.isOpen = true;
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.updateSelectionState();
    this.open.emit();

    // Check available space after a short delay to ensure dropdown is rendered
    setTimeout(() => {
      this.checkAvailableSpace();
      
      // Focus search input if searchable
      if (this.searchable && this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 0);
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.removeScrollListeners();
    this.close.emit();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;

    this.filteredOptions = this.options.filter(option =>
      option.label.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );

    this.updateSelectionState();
    this.searchChange.emit(this.searchQuery);

    // Recalculate position when content changes
    if (this.isOpen) {
      setTimeout(() => {
        this.checkAvailableSpace();
      }, 0);
    }
  }

  selectOption(option: DropdownOption, event?: Event): void {
    if (option.disabled) return;

    // In multi-select mode, ignore clicks that came from checkbox or label
    // (they're handled by onCheckboxToggle)
    if (this.multiSelect && event) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
        return;
      }
      if (target.tagName === 'LABEL' || target.closest('label')) {
        return;
      }
    }

    if (this.multiSelect) {
      this.toggleMultiSelect(option);
    } else {
      this.selectSingle(option);
    }
  }

  private selectSingle(option: DropdownOption): void {
    this.selectedValues = [option.value];
    this.selectedOptions = [option];
    this.selectionChange.emit([option.value]);

    if (this.closeOnSelect) {
      this.closeDropdown();
    }
  }

  private toggleMultiSelect(option: DropdownOption): void {
    const index = this.selectedValues.indexOf(option.value);

    if (index > -1) {
      // Prevent deselecting if it would go below minimum selections
      if (this.selectedValues.length - 1 < this.minSelections) {
        return;
      }
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(option.value);
    }

    this.updateSelectedOptions();
    this.updateSelectionState();
    this.selectionChange.emit([...this.selectedValues]);
  }

  onCheckboxMouseDown(): void {
    // Set flag to ignore the next document click/mousedown (which might close the dropdown)
    this.ignoreNextClick = true;
    
    // Reset flag after a short delay
    setTimeout(() => {
      this.ignoreNextClick = false;
    }, 200);
  }

  onCheckboxToggle(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    if (option.disabled) return;
    this.toggleMultiSelect(option);
  }
  
  onLabelClick(event: Event, option: DropdownOption): void {
    event.stopPropagation();
    if (option.disabled) return;
    // Prevent the global click/mousedown from closing while interacting via label.
    // Do NOT toggle here; the associated checkbox change event will handle selection.
    this.ignoreNextClick = true;
    setTimeout(() => {
      this.ignoreNextClick = false;
    }, 200);
  }

  selectAll(): void {
    if (!this.multiSelect) return;

    this.selectedValues = this.filteredOptions
      .filter(option => !option.disabled)
      .map(option => option.value);

    this.updateSelectedOptions();
    this.updateSelectionState();
    this.selectionChange.emit([...this.selectedValues]);
  }

  clearSelection(): void {
    // Don't clear if it would go below minimum selections
    if (this.minSelections > 0) {
      return;
    }

    this.selectedValues = [];
    this.selectedOptions = [];
    this.allSelected = false;
    this.partialSelected = false;
    this.selectionChange.emit([]);
  }

  removeSelectedValue(value: any): void {
    if (!this.multiSelect) return;

    // Prevent removing if it would go below minimum selections
    if (this.selectedValues.length - 1 < this.minSelections) {
      return;
    }

    const index = this.selectedValues.indexOf(value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
      this.updateSelectedOptions();
      this.updateSelectionState();
      this.selectionChange.emit([...this.selectedValues]);
    }
  }

  isSelected(option: DropdownOption): boolean {
    return this.selectedValues.includes(option.value);
  }

  getDisplayText(): string {
    if (this.selectedOptions.length === 0 && this.selectedValues.length === 0) {
      return this.placeholder;
    }

    if (this.multiSelect) {
      const count = this.selectedValues.length || this.selectedOptions.length;
      if (count === 1) {
        // Find label from options using value to be resilient if selectedOptions isn't synced yet
        const value = (this.selectedValues[0] !== undefined) ? this.selectedValues[0] : this.selectedOptions[0]?.value;
        const opt = this.options.find(o => String(o.value) === String(value));
        return opt?.label || this.selectedOptions[0]?.label || this.placeholder;
      }
      return `${count} items selected`;
    }

    // Single-select: derive label safely from selectedValues/options
    const value = (this.selectedValues[0] !== undefined) ? this.selectedValues[0] : this.selectedOptions[0]?.value;
    const opt = this.options.find(o => String(o.value) === String(value));
    return opt?.label || this.selectedOptions[0]?.label || this.placeholder;
  }

  // Get visible selected items based on configuration
  getVisibleSelectedItems(): DropdownOption[] {
    if (!this.showSelectedItems || !this.multiSelect) {
      return [];
    }

    if (this.selectedItemsStyle === 'compact') {
      return this.selectedOptions.slice(0, this.maxSelectedItemsDisplay);
    }

    return this.selectedOptions;
  }

  // Check if there are more items than displayed
  hasMoreSelectedItems(): boolean {
    return this.selectedOptions.length > this.maxSelectedItemsDisplay;
  }

  // Get count of hidden items
  getHiddenItemsCount(): number {
    return Math.max(0, this.selectedOptions.length - this.maxSelectedItemsDisplay);
  }

  get dropdownClasses(): string {
    return [
      'dropdown',
      this.isOpen ? 'dropdown-open' : '',
      this.disabled ? 'dropdown-disabled' : '',
      this.loading ? 'dropdown-loading' : ''
    ].filter(Boolean).join(' ');
  }

  get dropdownListClasses(): string {
    return [
      'dropdown-list',
      this.multiSelect ? 'dropdown-multi' : 'dropdown-single',
      this.openUpward ? 'dropdown-upward' : ''
    ].filter(Boolean).join(' ');
  }

  private focusNextOption(): void {
    // Implementation for keyboard navigation
  }

  private focusPreviousOption(): void {
    // Implementation for keyboard navigation
  }

  private selectFocusedOption(): void {
    // Implementation for keyboard navigation
  }
}
