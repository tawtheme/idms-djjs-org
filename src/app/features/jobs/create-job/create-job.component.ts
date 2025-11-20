import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DatepickerComponent } from '../../../shared/components/datepicker/datepicker.component';
import { DropdownComponent, DropdownOption } from '../../../shared/components/dropdown/dropdown.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { DataService } from '../../../data.service';
import { FileUploadComponent } from '../../../shared/components/file-upload/file-upload.component';

@Component({
  standalone: true,
  selector: 'app-create-job',
  imports: [CommonModule, FormsModule, RouterModule, DatepickerComponent, DropdownComponent, BreadcrumbComponent, FileUploadComponent],
  templateUrl: './create-job.component.html',
  styleUrls: ['./create-job.component.scss']
})
export class CreateJobComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Jobs', route: '/jobs' },
    { label: 'Create Job', route: '/jobs/create' }
  ];

  job: any = {
    basic_info: {
      job_id: '',
      job_title: '',
      job_type: '',
      job_description: '',
      priority: '',
      status: ''
    },
    customer_info: {
      customer_id: '',
      customer_name: '',
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      billing_address: '',
      shipping_address: ''
    },
    order_details: {
      order_source: '',
      order_number: '',
      order_date: '',
      due_date: '',
      assigned_to: ''
    },
    printing_specifications: {
      quantity: null,
      size: '',
      paper_type: '',
      paper_gsm: '',
      print_side: '',
      color_mode: '',
      finishing_options: [],
      binding_type: '',
      folding_type: '',
      proof_required: false
    },
    artwork: {
      artwork_files: [],
      proof_file: '',
      designer_assigned: '',
      design_notes: ''
    },
    production: {
      production_stage: '',
      operator: '',
      material_used: '',
      qc_approved_by: '',
      qc_approval_date: ''
    },
    notes: {
      internal_remarks: '',
      customer_feedback: '',
      job_closure_status: ''
    },
    meta: {
      created_by: '',
      created_at: '',
      updated_at: ''
    }
  };

  submitting = false;
  artworkFilesText: string = '';

  // Dropdown options
  jobTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Booklet', value: 'Booklet' },
    { id: '2', label: 'Flyer', value: 'Flyer' },
    { id: '3', label: 'Poster', value: 'Poster' },
    { id: '4', label: 'Business Card', value: 'Business Card' },
    { id: '5', label: 'Brochure', value: 'Brochure' },
    { id: '6', label: 'Catalog', value: 'Catalog' },
    { id: '7', label: 'Other', value: 'Other' }
  ];

  priorityOptions: DropdownOption[] = [
    { id: '1', label: 'Low', value: 'Low' },
    { id: '2', label: 'Normal', value: 'Normal' },
    { id: '3', label: 'High', value: 'High' },
    { id: '4', label: 'Rush', value: 'Rush' }
  ];

  statusOptions: DropdownOption[] = [
    { id: '1', label: 'Pending', value: 'Pending' },
    { id: '2', label: 'In Progress', value: 'In Progress' },
    { id: '3', label: 'On Hold', value: 'On Hold' },
    { id: '4', label: 'Completed', value: 'Completed' },
    { id: '5', label: 'Cancelled', value: 'Cancelled' }
  ];

  orderSourceOptions: DropdownOption[] = [
    { id: '1', label: 'Amazon', value: 'Amazon' },
    { id: '2', label: 'Website', value: 'Website' },
    { id: '3', label: 'Phone', value: 'Phone' },
    { id: '4', label: 'Email', value: 'Email' },
    { id: '5', label: 'Walk-in', value: 'Walk-in' }
  ];

  paperTypeOptions: DropdownOption[] = [
    { id: '1', label: 'Matte Art Paper', value: 'Matte Art Paper' },
    { id: '2', label: 'Glossy Paper', value: 'Glossy Paper' },
    { id: '3', label: 'Bond Paper', value: 'Bond Paper' },
    { id: '4', label: 'Cardstock', value: 'Cardstock' },
    { id: '5', label: 'Textured Paper', value: 'Textured Paper' }
  ];

  paperGsmOptions: DropdownOption[] = [
    { id: '1', label: '80 GSM', value: '80 GSM' },
    { id: '2', label: '100 GSM', value: '100 GSM' },
    { id: '3', label: '120 GSM', value: '120 GSM' },
    { id: '4', label: '150 GSM', value: '150 GSM' },
    { id: '5', label: '170 GSM', value: '170 GSM' },
    { id: '6', label: '200 GSM', value: '200 GSM' },
    { id: '7', label: '250 GSM', value: '250 GSM' }
  ];

  printSideOptions: DropdownOption[] = [
    { id: '1', label: 'Single', value: 'Single' },
    { id: '2', label: 'Double', value: 'Double' }
  ];

  colorModeOptions: DropdownOption[] = [
    { id: '1', label: 'CMYK', value: 'CMYK' },
    { id: '2', label: 'RGB', value: 'RGB' },
    { id: '3', label: 'Grayscale', value: 'Grayscale' },
    { id: '4', label: 'Spot Color', value: 'Spot Color' }
  ];

  bindingTypeOptions: DropdownOption[] = [
    { id: '1', label: 'None', value: 'None' },
    { id: '2', label: 'Saddle Stitch', value: 'Saddle Stitch' },
    { id: '3', label: 'Perfect Bound', value: 'Perfect Bound' },
    { id: '4', label: 'Spiral Bound', value: 'Spiral Bound' },
    { id: '5', label: 'Wire-O', value: 'Wire-O' },
    { id: '6', label: 'Casebound', value: 'Casebound' }
  ];

  foldingTypeOptions: DropdownOption[] = [
    { id: '1', label: 'None', value: 'None' },
    { id: '2', label: 'Half Fold', value: 'Half Fold' },
    { id: '3', label: 'Tri-fold', value: 'Tri-fold' },
    { id: '4', label: 'Z-fold', value: 'Z-fold' },
    { id: '5', label: 'Gate Fold', value: 'Gate Fold' }
  ];

  productionStageOptions: DropdownOption[] = [
    { id: '1', label: 'Prepress', value: 'Prepress' },
    { id: '2', label: 'Printing', value: 'Printing' },
    { id: '3', label: 'Finishing', value: 'Finishing' },
    { id: '4', label: 'Quality Control', value: 'Quality Control' },
    { id: '5', label: 'Packaging', value: 'Packaging' },
    { id: '6', label: 'Completed', value: 'Completed' }
  ];

  jobClosureStatusOptions: DropdownOption[] = [
    { id: '1', label: 'Open', value: 'Open' },
    { id: '2', label: 'In Progress', value: 'In Progress' },
    { id: '3', label: 'Closed', value: 'Closed' },
    { id: '4', label: 'Cancelled', value: 'Cancelled' }
  ];

  assignedToOptions: DropdownOption[] = [
    { id: '1', label: 'John Doe', value: 'John Doe' },
    { id: '2', label: 'Jane Smith', value: 'Jane Smith' },
    { id: '3', label: 'Mike Johnson', value: 'Mike Johnson' },
    { id: '4', label: 'Sarah Williams', value: 'Sarah Williams' },
    { id: '5', label: 'David Brown', value: 'David Brown' },
    { id: '6', label: 'Emily Davis', value: 'Emily Davis' }
  ];

  sizeOptions: DropdownOption[] = [
    { id: '1', label: 'A4 (8.27 x 11.69 in)', value: 'A4 (8.27 x 11.69 in)' },
    { id: '2', label: 'A5 (5.83 x 8.27 in)', value: 'A5 (5.83 x 8.27 in)' },
    { id: '3', label: 'A3 (11.69 x 16.54 in)', value: 'A3 (11.69 x 16.54 in)' },
    { id: '4', label: 'Letter (8.5 x 11 in)', value: 'Letter (8.5 x 11 in)' },
    { id: '5', label: 'Legal (8.5 x 14 in)', value: 'Legal (8.5 x 14 in)' },
    { id: '6', label: 'Tabloid (11 x 17 in)', value: 'Tabloid (11 x 17 in)' },
    { id: '7', label: 'Half Letter (5.5 x 8.5 in)', value: 'Half Letter (5.5 x 8.5 in)' },
    { id: '8', label: 'Business Card (3.5 x 2 in)', value: 'Business Card (3.5 x 2 in)' }
  ];

  orderNumberOptions: DropdownOption[] = [];
  loadingOrders = false;
  selectedOrderItems: any[] = [];
  uploadedFiles: File[] = [];

  fileUploadConfig = {
    multiple: true,
    accept: '.pdf,.jpg,.jpeg,.png,.ai,.eps,.psd,.indd',
    maxSizeMb: 50,
    maxFiles: 10,
    dropText: 'Drag & drop files here or',
    buttonText: 'Browse Files',
    showFileListHeader: true,
    fileListHeaderText: '{{count}} file{{plural}} selected'
  };
 
  // Per-item editing helpers
  getItemSelectedValues(value: string | null | undefined): any[] {
    return this.getSelectedValues(value);
  }
 
  onItemDropdownChange(index: number, field: string, values: any[]): void {
    if (!Array.isArray(this.selectedOrderItems) || !this.selectedOrderItems[index]) return;
    const value = values && values.length > 0 ? values[0] : '';
    // Ensure object exists
    this.selectedOrderItems[index] = { ...this.selectedOrderItems[index], [field]: value };
  }

  constructor(private router: Router, private data: DataService) { }

  // Helper method to get selected values array for dropdown
  getSelectedValues(value: string | null | undefined): any[] {
    // Return empty array if value is null, undefined, or empty string to show placeholder
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return [];
    }
    return [value];
  }

  // Helper method to handle dropdown selection change
  onDropdownChange(fieldPath: string[], values: any[]): void {
    let target = this.job;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      target = target[fieldPath[i]];
    }
    target[fieldPath[fieldPath.length - 1]] = values.length > 0 ? values[0] : '';
  }

  ngOnInit(): void {
    // Start blank – do not hydrate from mock. Keep helper text in sync if needed.
    if (Array.isArray(this.job.artwork?.artwork_files) && this.job.artwork.artwork_files.length > 0) {
      this.artworkFilesText = this.job.artwork.artwork_files.join('\n');
    }
    
    // Load available Amazon orders that haven't been converted to jobs
    this.loadAvailableOrders();
  }

  private loadAvailableOrders(): void {
    this.loadingOrders = true;
    this.data.getJson<any>('orders.json').subscribe({
      next: (response) => {
        const allOrders = response?.orders || [];
        
        // Filter orders: Amazon orders that haven't been converted to jobs
        const availableOrders = allOrders.filter((order: any) => {
          const isAmazon = (order.order_source || '').toLowerCase() === 'amazon';
          const notLinked = !order.linked_job_id && (order.job_linked === false || !order.job_linked);
          return isAmazon && notLinked;
        });
        
        // Create dropdown options - show only order number
        this.orderNumberOptions = availableOrders.map((order: any, index: number) => ({
          id: String(index + 1),
          label: order.order_id,
          value: order.order_id
        }));
        
        this.loadingOrders = false;
      },
      error: () => {
        this.orderNumberOptions = [];
        this.loadingOrders = false;
      }
    });
  }

  onOrderNumberChange(event: any): void {
    if (!event || event.length === 0) {
      this.job.order_details.order_number = '';
      this.selectedOrderItems = [];
      return;
    }
    
    const selectedOrderId = event[0];
    this.job.order_details.order_number = selectedOrderId;
    
    // Load order details and auto-fill some fields
    this.data.getJson<any>('orders.json').subscribe({
      next: (response) => {
        const allOrders = response?.orders || [];
        const selectedOrder = allOrders.find((o: any) => o.order_id === selectedOrderId);
        
        if (selectedOrder) {
          // Store order items for display
          this.selectedOrderItems = selectedOrder.items || [];
          
          // Auto-fill order details from selected order
          if (selectedOrder.order_date) {
            this.job.order_details.order_date = selectedOrder.order_date;
          }
          if (selectedOrder.due_date) {
            this.job.order_details.due_date = selectedOrder.due_date;
          }
          if (selectedOrder.order_source) {
            this.job.order_details.order_source = selectedOrder.order_source;
          }
          if (selectedOrder.assigned_to) {
            this.job.order_details.assigned_to = selectedOrder.assigned_to;
          }
          
          // Auto-fill printing specifications from order items if available
          if (selectedOrder.items && selectedOrder.items.length > 0) {
            const firstItem = selectedOrder.items[0];
            if (firstItem.quantity_ordered) {
              this.job.printing_specifications.quantity = firstItem.quantity_ordered;
            }
            if (firstItem.size) {
              this.job.printing_specifications.size = firstItem.size;
            }
            if (firstItem.paper_type) {
              this.job.printing_specifications.paper_type = firstItem.paper_type;
            }
            if (firstItem.color_mode) {
              this.job.printing_specifications.color_mode = firstItem.color_mode;
            }
            if (firstItem.binding) {
              this.job.printing_specifications.binding_type = firstItem.binding;
            }
          }
        }
      }
    });
  }

  save(): void {
    if (!this.job.basic_info.job_id || !this.job.basic_info.job_title) {
      alert('Please fill Job ID and Job Title');
      return;
    }

    // Normalize artwork files into array from either textarea helper or direct input binding
    const current = this.job.artwork.artwork_files;
    if (typeof current === 'string' && current.trim().length > 0) {
      this.job.artwork.artwork_files = current
        .split(/\n|,/) // support comma or newline separated
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);
    } else if (this.artworkFilesText) {
      this.job.artwork.artwork_files = this.artworkFilesText
        .split('\n')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);
    }

    // Set meta information
    const now = new Date().toISOString();
    this.job.meta.created_at = now;
    this.job.meta.updated_at = now;

    this.submitting = true;
    console.log('Saving job:', JSON.stringify(this.job, null, 2));

    setTimeout(() => {
      this.submitting = false;
      this.router.navigateByUrl('/jobs');
    }, 400);
  }

  cancel(): void {
    this.router.navigateByUrl('/jobs');
  }

  onOrderDateChange(date: Date | null): void {
    this.job.order_details.order_date = date ? this.formatYmd(date) : '';
  }

  onDueDateChange(date: Date | null): void {
    this.job.order_details.due_date = date ? this.formatYmd(date) : '';
  }

  onQcApprovalDateChange(date: Date | null): void {
    this.job.production.qc_approval_date = date ? this.formatYmd(date) : '';
  }

  private formatYmd(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDateValue(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  isFinishingSelected(option: string): boolean {
    return this.job.printing_specifications.finishing_options?.includes(option) || false;
  }

  toggleFinishing(option: string): void {
    if (!this.job.printing_specifications.finishing_options) {
      this.job.printing_specifications.finishing_options = [];
    }
    const index = this.job.printing_specifications.finishing_options.indexOf(option);
    if (index > -1) {
      this.job.printing_specifications.finishing_options.splice(index, 1);
    } else {
      this.job.printing_specifications.finishing_options.push(option);
    }
  }

  toggleProofRequired(): void {
    this.job.printing_specifications.proof_required = !this.job.printing_specifications.proof_required;
  }

  onFilesSelected(files: File[]): void {
    this.uploadedFiles = [...this.uploadedFiles, ...files];
    // Store file names/URLs in artwork files (in a real app, you'd upload to server first)
    const fileNames = this.uploadedFiles.map(f => f.name);
    if (this.job.artwork.artwork_files) {
      if (Array.isArray(this.job.artwork.artwork_files)) {
        this.job.artwork.artwork_files = [...this.job.artwork.artwork_files, ...fileNames];
      } else {
        this.job.artwork.artwork_files = fileNames;
      }
    } else {
      this.job.artwork.artwork_files = fileNames;
    }
  }

  onFileRemoved(file: File): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f !== file);
    // Remove from artwork files
    if (Array.isArray(this.job.artwork.artwork_files)) {
      this.job.artwork.artwork_files = this.job.artwork.artwork_files.filter((name: string) => name !== file.name);
    }
  }

  onFileRejected(event: { file: File; reason: string }): void {
    alert(`File "${event.file.name}" was rejected: ${event.reason}`);
  }
}
