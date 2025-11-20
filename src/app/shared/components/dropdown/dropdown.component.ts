import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, FormsModule],
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
  dropdownPosition: { top: string; left: string; right: string; bottom: string } = {
    top: '100%',
    left: '0',
    right: 'auto',
    bottom: 'auto'
  };
  openUpward: boolean = false;
  private portalReturnParent: HTMLElement | null = null;
  private scrollListener?: () => void;
  private resizeListener?: () => void;
  private ignoreNextClick: boolean = false;
  private nearestScrollParent: HTMLElement | Window | null = null;
  isPortaled: boolean = false;

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
      setTimeout(() => {
        this.updateDropdownPosition();
      }, 0);
    }
  }

  private addScrollListeners(): void {
    if (this.scrollListener) return;

    this.scrollListener = () => {
      if (this.isOpen) {
        this.updateDropdownPosition();
      }
    };

    // Listen to scroll on window and all scrollable parents
    window.addEventListener('scroll', this.scrollListener, true);
    document.addEventListener('scroll', this.scrollListener, true);
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

    // Calculate position after dropdown is rendered
    // Use multiple requestAnimationFrame calls to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.moveListToBody();
          this.updateDropdownPosition();
          this.addScrollListeners();

          // Recalculate position again after content is fully rendered
          // This ensures accurate height calculation
          setTimeout(() => {
            this.updateDropdownPosition();
          }, 50);

          // Focus search input if searchable
          if (this.searchable && this.searchInput) {
            this.searchInput.nativeElement.focus();
          }
        }, 0);
      });
    });
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.searchQuery = '';
    this.filteredOptions = [...this.options];
    this.removeScrollListeners();
    this.close.emit();
    // Return list to original container if it was portaled
    const list = this.dropdownList?.nativeElement;
    if (list && this.portalReturnParent && this.portalReturnParent !== document.body) {
      this.portalReturnParent.appendChild(list);
      list.classList.remove('dropdown-portal');
      // Clean up all inline styles
      list.style.position = '';
      list.style.top = '';
      list.style.left = '';
      list.style.right = '';
      list.style.bottom = '';
      list.style.width = '';
      list.style.minWidth = '';
      list.style.maxWidth = '';
      this.portalReturnParent = null;
      this.isPortaled = false;
    }
  }

  // Find the nearest scrollable ancestor to determine available space within containers (e.g., modals)
  private getNearestScrollableParent(element: HTMLElement | null): HTMLElement | Window {
    if (!element) return window;
    let parent: HTMLElement | null = element.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      const isScrollable = /(auto|scroll|overlay)/.test(overflowY) || /(auto|scroll|overlay)/.test(overflow);
      if (isScrollable && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return window;
  }

  private moveListToBody(): void {
    const list = this.dropdownList?.nativeElement;
    if (!list) return;
    if (list.parentElement !== document.body) {
      this.portalReturnParent = list.parentElement as HTMLElement;
      document.body.appendChild(list);
      list.classList.add('dropdown-portal');
      list.style.position = 'fixed';
      this.isPortaled = true;
    }
  }

  updateDropdownPosition(): void {
    if (!this.dropdownList) return;

    const trigger = this.elementRef.nativeElement.querySelector('.dropdown-trigger');
    if (!trigger) return;

    // Determine nearest scrollable parent for space calculations
    this.nearestScrollParent = this.getNearestScrollableParent(this.elementRef.nativeElement as HTMLElement);

    const dropdown = this.dropdownList.nativeElement;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const triggerRect = trigger.getBoundingClientRect();

    // Get dropdown height
    const dropdownRect = dropdown.getBoundingClientRect();
    let dropdownHeight = dropdownRect.height;

    // Calculate available space in viewport
    const viewportSpaceBelow = viewport.height - triggerRect.bottom;
    const viewportSpaceAbove = triggerRect.top;

    // Calculate available space within the nearest scrollable container (if any)
    let containerSpaceBelow = viewportSpaceBelow;
    let containerSpaceAbove = viewportSpaceAbove;
    if (this.nearestScrollParent && this.nearestScrollParent !== window) {
      const containerRect = (this.nearestScrollParent as HTMLElement).getBoundingClientRect();
      containerSpaceBelow = Math.max(0, containerRect.bottom - triggerRect.bottom);
      containerSpaceAbove = Math.max(0, triggerRect.top - containerRect.top);
    }

    // Use the more restrictive space (container vs viewport)
    const spaceBelow = Math.min(viewportSpaceBelow, containerSpaceBelow);
    const spaceAbove = Math.min(viewportSpaceAbove, containerSpaceAbove);

    // If height is 0 or very small (dropdown not fully rendered), use maxHeight as estimate
    // But also consider available space
    if (dropdownHeight < 10) {
      dropdownHeight = Math.min(this.maxHeight, spaceBelow, spaceAbove, viewport.height - 16);
    }

    // Add margin for spacing
    const margin = 8;
    const requiredSpace = dropdownHeight + margin;
    
    // More aggressive threshold: if less than 250px below, check if we should open upward
    // Also consider if we're in the bottom half of the viewport
    const isInBottomHalf = triggerRect.bottom > viewport.height / 2;
    const upwardThreshold = 250;

    // compute direction and positioning

    // Reset to default (open downward)
    this.openUpward = false;
    this.dropdownPosition = {
      top: '100%',
      left: '0',
      right: 'auto',
      bottom: 'auto'
    };

    // Check if we need to open upward
    // Open upward if:
    // 1. Not enough space below for the dropdown AND more space above, OR
    // 2. Space below is less than threshold AND space above is greater, OR
    // 3. We're in bottom half of viewport AND space above is significantly more than space below
    const condition1 = spaceBelow < requiredSpace && spaceAbove > spaceBelow;
    const condition2 = spaceBelow < upwardThreshold && spaceAbove > spaceBelow;
    const condition3 = isInBottomHalf && spaceAbove > spaceBelow + 50;
    
    // Honor explicit openDirection overrides
    let shouldOpenUpward = condition1 || condition2 || condition3;
    if (this.openDirection === 'up') {
      shouldOpenUpward = true;
    } else if (this.openDirection === 'down') {
      shouldOpenUpward = false;
    }

    if (shouldOpenUpward) {
      this.openUpward = true;
      this.dropdownPosition = {
        top: 'auto',
        left: '0',
        right: 'auto',
        bottom: '100%'
      };
    }

    // Check horizontal space and adjust if needed
    const spaceRight = viewport.width - triggerRect.left;
    const spaceLeft = triggerRect.left;
    const dropdownWidth = dropdown.getBoundingClientRect().width || triggerRect.width;

    if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
      // Open to the left if more space on the left
      this.dropdownPosition = {
        ...this.dropdownPosition,
        left: 'auto',
        right: '0'
      };
    } else if (spaceRight < dropdownWidth) {
      // If not enough space on right, try to fit it
      this.dropdownPosition = {
        ...this.dropdownPosition,
        left: 'auto',
        right: '0'
      };
    }

    // Apply computed fixed coordinates when portaled to body
    if (dropdown.parentElement === document.body) {
      // Prefer min-width equal to trigger, allow content to define width up to viewport
      const minWidth = Math.min(triggerRect.width, viewport.width - 16);
      const maxWidth = viewport.width - 16; // Leave 8px margin on each side
      dropdown.style.removeProperty('width'); // let content define intrinsic width
      dropdown.style.minWidth = `${Math.max(200, minWidth)}px`;
      dropdown.style.maxWidth = `${maxWidth}px`;

      // Vertical positioning
      if (this.openUpward) {
        // Explicitly set top to auto to override CSS default of top: 100%
        dropdown.style.setProperty('top', 'auto', 'important');
        dropdown.style.setProperty('bottom', `${viewport.height - triggerRect.top + 4}px`, 'important');
      } else {
        dropdown.style.setProperty('bottom', 'auto', 'important');
        dropdown.style.setProperty('top', `${triggerRect.bottom + 4}px`, 'important');
      }

      // Constrain height to available space (above or below)
      // Use the restrictive space between viewport and container
      const availableUpViewport = triggerRect.top - margin;
      const availableDownViewport = viewport.height - triggerRect.bottom - margin;
      let availableUp = availableUpViewport;
      let availableDown = availableDownViewport;
      if (this.nearestScrollParent && this.nearestScrollParent !== window) {
        const containerRect = (this.nearestScrollParent as HTMLElement).getBoundingClientRect();
        availableUp = Math.max(0, Math.min(availableUpViewport, triggerRect.top - containerRect.top - margin));
        availableDown = Math.max(0, Math.min(availableDownViewport, containerRect.bottom - triggerRect.bottom - margin));
      }
      const available = this.openUpward ? availableUp : availableDown;
      const constrainedMax = Math.max(120, Math.min(this.maxHeight, available)); // keep a sensible minimum
      dropdown.style.maxHeight = `${constrainedMax}px`;

      // Horizontal positioning - ensure dropdown stays within viewport
      let leftPos: number | '' = triggerRect.left;
      let rightPos = '';

      // Check if dropdown would overflow on the right
      const predictedWidth = Math.min(Math.max(dropdownRect.width, minWidth), maxWidth);
      if ((leftPos as number) + predictedWidth > viewport.width - 8) {
        // Try to align to right edge of trigger
        const rightEdge = triggerRect.right;
        if (rightEdge - predictedWidth >= 8) {
          // Can fit by aligning to right edge
          leftPos = '';
          rightPos = `${viewport.width - rightEdge}px`;
        } else {
          // Not enough space, align to viewport edge with margin
          leftPos = '';
          rightPos = '8px';
        }
      } else if ((leftPos as number) < 8) {
        // Too close to left edge
        leftPos = 8 as number;
        rightPos = '';
      }

      if (rightPos) {
        dropdown.style.left = '';
        dropdown.style.right = rightPos;
      } else {
        dropdown.style.right = '';
        dropdown.style.left = `${leftPos as number}px`;
      }

      // Ensure dropdown doesn't overflow vertically
      const dropdownTop = this.openUpward
        ? viewport.height - parseFloat(dropdown.style.bottom || '0')
        : parseFloat(dropdown.style.top || '0');

      if (dropdownTop + dropdownHeight > viewport.height - 8) {
        // Adjust to fit in viewport
        const maxTop = viewport.height - dropdownHeight - 8;
        if (this.openUpward) {
          dropdown.style.setProperty('bottom', `${viewport.height - maxTop}px`, 'important');
        } else {
          dropdown.style.setProperty('top', `${Math.max(8, maxTop)}px`, 'important');
        }
      }
    }
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
        this.updateDropdownPosition();
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
      console.log(`Cannot clear all selections. Minimum ${this.minSelections} selections required.`);
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
      console.log(`Cannot remove selection. Minimum ${this.minSelections} selections required.`);
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

    return this.selectedOptions[0].label;
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
