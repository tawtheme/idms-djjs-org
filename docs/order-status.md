# Order Status – How it Works

This app models a simple production flow from intake to fulfillment. Statuses are mutually exclusive; an order has exactly one status at a time.

## Statuses

1) Pending Production
- What it means: Order is accepted and waiting to be planned or released to the production floor.
- Typical actions: Capacity check, materials check, schedule job, assign operator.
- Transitions:
  - Pending Production → In Production (when work starts)
  - Pending Production → Cancelled (if customer cancels or fails checks)

2) In Production
- What it means: Printing/finishing is actively happening (or queued and released) on the shop floor.
- Typical actions: Print, bind/finish, QC, pack list generation.
- Transitions:
  - In Production → Ready to Ship (after QC/packing complete)
  - In Production → Cancelled (rare; e.g., unrecoverable issue/customer request)

3) Ready to Ship
- What it means: Goods are produced, packed, and awaiting carrier handoff/label.
- Typical actions: Create shipping label, book pickup, finalize paperwork.
- Transitions:
  - Ready to Ship → Shipped (when carrier scans/pickup confirmed)

4) Shipped
- What it means: Parcel has left the facility and is with the carrier.
- Typical actions: Tracking updates, delivery ETA, customer notifications.
- Transitions:
  - Shipped → Completed (optional; when POD/delivery confirmation is received)

5) New
- What it means: Freshly imported/created order, not yet triaged.
- Typical actions: Validate payload, enrich metadata, move to Pending Production.
- Transitions:
  - New → Pending Production
  - New → Cancelled (invalid order)

6) Completed (optional, not always used)
- What it means: Order lifecycle is fully closed after successful delivery and invoicing.
- Typical actions: Archive, analytics, retention.
- Transitions:
  - Shipped → Completed

7) Cancelled
- What it means: Order will not be produced/shipped.
- Typical actions: Refund/cancellation comms, release reservations.
- Transitions: Terminal (no further movement).

## Typical Lifecycle
New → Pending Production → In Production → Ready to Ship → Shipped → (Completed)

## Notes
- The UI filters and badges map directly to these states (see `orders.component.ts`).
- Integrations may skip "Completed" if shipment delivery confirmation is out-of-scope.

