import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface JobItem {
  sku?: string;
  title?: string;
  quantity?: number;
  size?: string;
  paper_type?: string;
  paper_gsm?: string;
  print_side?: string;
  color_mode?: string;
  binding_type?: string;
  folding_type?: string;
  finishing_options?: string[];
}

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnInit, OnChanges {
  @Input() jobTitle: string = '';
  @Input() items: JobItem[] = [];
  @Input() title: string = 'Printing Specifications';
  @Input() showTitle: boolean = true;

  // Expandable state for printing specifications
  printingSpecsExpanded: { [key: number]: boolean } = {};

  ngOnInit(): void {
    this.initializeExpandedState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.initializeExpandedState();
    }
  }

  private initializeExpandedState(): void {
    // If single item, always show expanded
    if (!this.hasMultipleItems()) {
      this.items.forEach((_, index) => {
        this.printingSpecsExpanded[index] = true;
      });
    }
  }

  hasMultipleItems(): boolean {
    return (this.items?.length || 0) > 1;
  }

  togglePrintingSpecs(index: number): void {
    this.printingSpecsExpanded[index] = !this.printingSpecsExpanded[index];
  }

  isPrintingSpecsExpanded(index: number): boolean {
    // If single item, always show expanded
    if (!this.hasMultipleItems()) {
      return true;
    }
    return this.printingSpecsExpanded[index] !== false;
  }

  hasItems(): boolean {
    return this.items && this.items.length > 0;
  }
}

