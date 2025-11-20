import { Component, Input, Inject, Optional, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../data.service';
import { DIALOG_DATA } from '@angular/cdk/dialog';

interface OrderItem {
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface JobStageActivity {
  stage: string;
  stage_label: string;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}

interface ActivityLogItem {
  date: string;
  action: string;
  user: string;
  source?: 'order' | 'job' | 'shipment';
  stage?: string;
}

interface ShipmentInfo {
  id: string;
  carrier: string;
  trackingNumber: string;
  shipDate: string;
  status: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
}

interface OrderDetailModel {
  id: string;
  source: string;
  status: string;
  orderDate: string;
  customerName: string;
  customerEmail?: string;
  billingAddress?: string;
  shippingAddress?: string;
  contactNumber?: string;
  items: OrderItem[];
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  total?: number;
  trackingCarrier?: string;
  trackingNumber?: string;
  eta?: string;
  linkedJobId?: string;
  jobStages?: JobStageActivity[];
  shipment?: ShipmentInfo;
  activityLog?: ActivityLogItem[];
}

@Component({
  standalone: true,
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
  imports: [CommonModule]
})
export class OrderDetailComponent implements OnChanges {
  @Input() orderId: string | null = null;
  id: string | null;
  loading = false;
  order: OrderDetailModel | null = null;

  constructor(private route: ActivatedRoute, private data: DataService, @Optional() @Inject(DIALOG_DATA) private dialogData: any) {
    this.id = null;
    if (this.dialogData && this.dialogData.orderId) {
      this.orderId = this.dialogData.orderId;
    }
  }

  get subtotalAmount(): number | null {
    if (!this.order || !this.order.items || this.order.items.length === 0) return null;
    return this.order.items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
  }

  ngOnInit(): void {
    this.id = this.orderId ?? this.route.snapshot.paramMap.get('id');
    this.tryLoad();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId']) {
      this.id = this.orderId ?? this.id ?? this.route.snapshot.paramMap.get('id');
      this.tryLoad();
    }
  }

  private tryLoad(): void {
    if (!this.id || this.loading || this.order) return;
    this.loading = true;
    this.data.getJson<any>('order-details.json').subscribe((resp) => {
      const list = resp?.orders || [];
      let found = list.find((o: any) => o.order_id === this.id) || list[0];
      
      // If linked_job_id not found in order-details.json, check orders.json
      if (found && !found.linked_job_id) {
        this.data.getJson<any>('orders.json').subscribe((ordersResp) => {
          const ordersList = ordersResp?.orders || [];
          const orderFromList = ordersList.find((o: any) => o.order_id === this.id);
          if (orderFromList && orderFromList.linked_job_id) {
            found = { ...found, linked_job_id: orderFromList.linked_job_id };
          }
          this.processOrderData(found);
        });
      } else {
        this.processOrderData(found);
      }
    }, () => { this.loading = false; });
  }

  private processOrderData(found: any): void {
    if (found) {
      this.order = this.mapToModel(found);
      // Enrich with customer email if missing: attempt lookup from customers.json by name
      if (!this.order.customerEmail && this.order.customerName) {
        this.data.getJson<any>('customers.json').subscribe((c) => {
          const arr = c?.customers || [];
          const m = arr.find((x: any) => x.name === this.order?.customerName);
          if (m && this.order) {
            this.order.customerEmail = m.email;
          }
        });
      }
      
      // Load linked job if available
      if (this.order.linkedJobId) {
        this.loadJobData(this.order.linkedJobId);
      }
      
      // Load shipment data
      this.loadShipmentData(this.order.id);
      
      // Load activity logs from order
      if (found.activity_log) {
        this.order.activityLog = found.activity_log.map((log: any) => ({
          date: log.date,
          action: log.action,
          user: log.user,
          source: 'order' as const
        }));
      }
    }
    this.loading = false;
  }

  private loadJobData(jobId: string): void {
    this.data.getJson<any>('jobs.json').subscribe((resp) => {
      const jobs = resp?.jobs || [];
      const job = jobs.find((j: any) => j.job_id === jobId);
      if (job && this.order) {
        this.order.jobStages = this.generateJobStages(job);
        
        // Merge job activity logs
        const jobActivityLog = this.generateJobActivityLog(job);
        if (this.order.activityLog) {
          this.order.activityLog = [...this.order.activityLog, ...jobActivityLog];
        } else {
          this.order.activityLog = jobActivityLog;
        }
        
        // Sort activity log by date (newest first)
        if (this.order.activityLog) {
          this.order.activityLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      }
    });
  }

  private loadShipmentData(orderId: string): void {
    this.data.getJson<any>('shipments_detail.json').subscribe((resp) => {
      const shipments = resp?.shipments || [];
      const shipment = shipments.find((s: any) => s.orderId === orderId);
      if (shipment && this.order) {
        this.order.shipment = {
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          shipDate: shipment.shipDate,
          status: shipment.status,
          estimatedDeliveryDate: shipment.estimatedDeliveryDate,
          actualDeliveryDate: shipment.actualDeliveryDate
        };
        
        // Merge shipment activity logs
        if (shipment.activityLog && shipment.activityLog.length > 0) {
          const shipmentActivityLog = shipment.activityLog.map((log: any) => ({
            date: log.timestamp || log.date,
            action: log.action,
            user: log.user,
            source: 'shipment' as const
          }));
          
          if (this.order.activityLog) {
            this.order.activityLog = [...this.order.activityLog, ...shipmentActivityLog];
          } else {
            this.order.activityLog = shipmentActivityLog;
          }
          
          // Sort activity log by date (newest first)
          if (this.order.activityLog) {
            this.order.activityLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
        }
      }
    });
  }

  private generateJobStages(job: any): JobStageActivity[] {
    const jobStages = [
      { id: 'production-manager', label: 'Production Manager', key: 'production_manager' },
      { id: 'per-press', label: 'Per Press Department', key: 'per_press' },
      { id: 'press-dept', label: 'Press Department', key: 'press_dept' },
      { id: 'qa', label: 'QA Department', key: 'qa' },
      { id: 'finishing', label: 'Finishing Department', key: 'finishing' }
    ];

    const currentStage = this.getCurrentJobStage(job);
    const activities: JobStageActivity[] = [];

    jobStages.forEach((stage, index) => {
      const currentIndex = jobStages.findIndex(s => s.key === currentStage);
      const stageIndex = index;
      const isCompleted = stageIndex < currentIndex;
      const isCurrent = stageIndex === currentIndex;
      
      activities.push({
        stage: stage.key,
        stage_label: stage.label,
        assigned_to: this.getStageAssignee(job, stage.key),
        started_at: isCompleted || isCurrent ? job.created_at : undefined,
        completed_at: isCompleted ? job.updated_at : undefined,
        status: isCompleted ? 'completed' : (isCurrent ? 'in_progress' : 'pending'),
        notes: this.getStageNotes(job, stage.key)
      });
    });

    return activities;
  }

  private generateJobActivityLog(job: any): ActivityLogItem[] {
    const log: ActivityLogItem[] = [];
    
    if (job.created_at) {
      log.push({
        date: job.created_at,
        action: 'Job created',
        user: job.created_by || 'System',
        source: 'job',
        stage: 'production_manager'
      });
    }

    const stages = this.generateJobStages(job);
    stages.forEach((activity) => {
      if (activity.started_at) {
        log.push({
          date: activity.started_at,
          action: `Started: ${activity.stage_label}`,
          user: activity.assigned_to || 'Unassigned',
          source: 'job',
          stage: activity.stage
        });
      }
      if (activity.completed_at && activity.completed_at !== activity.started_at) {
        log.push({
          date: activity.completed_at,
          action: `Completed: ${activity.stage_label}`,
          user: activity.assigned_to || 'Unassigned',
          source: 'job',
          stage: activity.stage
        });
      }
    });

    if (job.updated_at && job.updated_at !== job.created_at) {
      log.push({
        date: job.updated_at,
        action: 'Job updated',
        user: job.created_by || 'System',
        source: 'job'
      });
    }

    return log;
  }

  private getCurrentJobStage(job: any): string {
    if (job.production_stage) {
      return job.production_stage;
    }
    
    const status = (job.status || '').toLowerCase();
    if (status === 'pending') {
      return 'production_manager';
    } else if (status === 'inprogress' || status === 'in progress') {
      return job.current_stage || 'per_press';
    } else if (status === 'completed') {
      return 'finishing';
    } else if (status === 'cancel' || status === 'cancelled') {
      return 'production_manager';
    }
    
    return 'production_manager';
  }

  private getStageAssignee(job: any, stageKey: string): string | undefined {
    switch (stageKey) {
      case 'production_manager':
        return job.assigned_to;
      case 'per_press':
        return job.designer_assigned;
      case 'press_dept':
        return job.operator;
      case 'qa':
        return job.qc_approved_by;
      case 'finishing':
      case 'packaging':
        return job.delivered_by;
      default:
        return undefined;
    }
  }

  private getStageNotes(job: any, stageKey: string): string | undefined {
    switch (stageKey) {
      case 'per_press':
        return job.design_notes;
      case 'press_dept':
        return job.material_used ? `Material: ${job.material_used}` : undefined;
      case 'qa':
        return job.qc_approval_date ? `Approved on ${this.formatDate(job.qc_approval_date)}` : undefined;
      default:
        return undefined;
    }
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        return dateString;
      }

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      if (dateString.includes('T')) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  }

  getStageLabel(stageKey: string): string {
    const stages: { [key: string]: string } = {
      'production_manager': 'Production Manager',
      'per_press': 'Per Press Department',
      'press_dept': 'Press Department',
      'qa': 'QA Department',
      'finishing': 'Finishing Department',
      'packaging': 'Finishing Department' // Legacy support
    };
    return stages[stageKey] || stageKey;
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    return 'status-' + status.toLowerCase().replace(/\s+/g, '_');
  }

  private mapToModel(o: any): OrderDetailModel {
    const bd = o.book_details || {};
    const costing = o.costing || {};
    const customer = o.customer_details || {};
    const shipAddr = customer.shipping_address || {};
    const billAddr = customer.billing_address || {};
    const ship = o.shipping_details || {};

    const items: OrderItem[] = [{
      title: bd.book_title,
      sku: bd.isbn,
      quantity: Number(bd.quantity) || 0,
      unitPrice: Number(costing.unit_cost) || 0,
    }];

    return {
      id: o.order_id,
      source: o.platform || 'Amazon',
      status: o.order_status,
      orderDate: o.order_date,
      customerName: customer.customer_name,
      customerEmail: customer.email,
      billingAddress: formatNewAddress(billAddr),
      shippingAddress: formatNewAddress(shipAddr),
      contactNumber: shipAddr.contact_number,
      items,
      subtotal: undefined,
      tax: undefined,
      shippingCost: undefined,
      total: Number(costing.total_cost) || undefined,
      trackingCarrier: ship.courier_name,
      trackingNumber: ship.tracking_number,
      eta: ship.dispatch_date || o.production_details?.expected_completion_date,
      linkedJobId: o.linked_job_id,
      activityLog: []
    };

    function formatNewAddress(addr: any): string | undefined {
      if (!addr) return undefined;
      const parts = [addr.name, addr.address_line1, addr.address_line2, `${addr.city}, ${addr.state} ${addr.postal_code}`, addr.country]
        .filter(Boolean);
      return parts.join('\n');
    }
  }
}


