# Shipment Status Guide

This document explains each shipment status used in the Amazon Print system.

## Status Definitions

### 1. label_created
**Color:** Yellow
- **Description:** The shipping label has been created and printed, but the package has not yet been picked up by the carrier.
- **When it occurs:** Immediately after generating the shipping label in the system.
- **Next steps:** Package is waiting for carrier pickup or drop-off at carrier location.

### 2. pre_transit
**Color:** Cyan
- **Description:** The shipment has been registered with the carrier and is in their system, but has not yet entered the transit network.
- **When it occurs:** After the carrier has scanned/received the package but before it leaves the origin facility.
- **Next steps:** Package will move to "processing" or "in_transit" once it enters the carrier's network.

### 3. processing
**Color:** Blue
- **Description:** The package is being processed or prepared for shipment at the carrier's facility.
- **When it occurs:** Package is at the origin facility being sorted, packaged, or prepared for transit.
- **Next steps:** Package will move to "in_transit" once processing is complete.

### 4. in_transit
**Color:** Lime Green
- **Description:** The package is actively moving through the carrier's network and is on its way to the destination.
- **When it occurs:** Package has left the origin facility and is traveling between locations.
- **Next steps:** Package will move to "out_for_delivery" when it reaches the destination area.

### 5. out_for_delivery
**Color:** Purple
- **Description:** The package is with the delivery agent and is scheduled for delivery on the current day.
- **When it occurs:** Package has reached the local delivery facility and is on the delivery vehicle.
- **Next steps:** Package should be delivered and move to "delivered" status, or "failed_attempt" if delivery cannot be completed.

### 6. delivered
**Color:** Green
- **Description:** The package has been successfully delivered to the recipient.
- **When it occurs:** Delivery has been completed and confirmed by the carrier.
- **Next steps:** This is the final successful status. No further action needed.

### 7. failed_attempt
**Color:** Red
- **Description:** A delivery attempt was made but was unsuccessful (recipient not available, address issue, etc.).
- **When it occurs:** Delivery agent attempted delivery but could not complete it.
- **Next steps:** Carrier will typically attempt delivery again, or package may move to "exception" or "returned_to_sender" if multiple attempts fail.

### 8. exception
**Color:** Fuchsia
- **Description:** An unexpected issue has occurred with the shipment that requires attention (damage, address problem, customs hold, etc.).
- **When it occurs:** Something unusual has happened that prevents normal delivery progression.
- **Next steps:** May require customer or carrier intervention. Could move to "on_hold", "returned_to_sender", or be resolved and continue delivery.

### 9. returned_to_sender
**Color:** Pink
- **Description:** The package is being returned to the sender/origin address.
- **When it occurs:** Package could not be delivered after multiple attempts, was refused by recipient, or has an undeliverable address.
- **Next steps:** Package will be sent back to the original sender. This is typically a final status for failed deliveries.

### 10. cancelled
**Color:** Gray
- **Description:** The shipment has been cancelled and will not be delivered.
- **When it occurs:** Shipment was cancelled by the sender or carrier before or during transit.
- **Next steps:** No delivery will occur. Package may be returned to sender or held at facility.

### 11. on_hold
**Color:** Rose
- **Description:** The shipment is temporarily on hold and not progressing through the delivery process.
- **When it occurs:** Package may be held due to payment issues, customs clearance, address verification, or other administrative reasons.
- **Next steps:** Once the hold is resolved, package will resume normal delivery process (may move to "in_transit", "processing", etc.).

## Status Flow Diagram

```
label_created → pre_transit → processing → in_transit → out_for_delivery → delivered
                                                              ↓
                                                      failed_attempt
                                                              ↓
                                                      (retry or exception)
                                                              ↓
                                              returned_to_sender / exception / on_hold
                                                              ↓
                                                          cancelled
```

## Notes

- **Multiple paths:** Some statuses can transition to multiple other statuses depending on the situation.
- **Carrier variations:** Different carriers (UPS, FedEx, DHL, USPS, Amazon Logistics) may use slightly different terminology, but these statuses represent the common states across all carriers.
- **Status colors:** Each status has a distinct color in the UI to help users quickly identify shipment states.

