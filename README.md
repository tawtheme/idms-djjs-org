# idms-djjs.org

A mock Angular application for a printing company ERP/CRM: manage books, print jobs, orders, inventory, CRM, purchasing, invoicing, shipments, production schedule, reports, settings, and Amazon integration. Uses standalone components and mock JSON assets.

## Prerequisites
- Node 18+
- npm 9+

## Run
```bash
npm install
npm start
# or
npm run start
```
App runs at http://localhost:4200

## Structure
- `src/app/models.ts` domain models
- `src/app/data.service.ts` simple HTTP JSON loader
- `src/app/features/*` standalone feature screens
- `src/assets/mock/*.json` mock data assets

## Key Screens
- Dashboard
- Orders (list) and Order Detail
- Jobs
- Books
- Inventory
- Customers
- Suppliers
- Users & Roles
- Quotes
- Invoices
- Purchase Orders
- Shipments
- Production Schedule
- Reports
- Settings
- Amazon: Import Orders, Status Sync, Logs

## Mock Data Endpoints
- `/assets/mock/orders.json`
- `/assets/mock/jobs.json`
- `/assets/mock/books.json`
- `/assets/mock/inventory.json`
- `/assets/mock/customers.json`
- `/assets/mock/suppliers.json`
- `/assets/mock/quotes.json`
- `/assets/mock/invoices.json`
- `/assets/mock/purchase-orders.json`
- `/assets/mock/shipments.json`
- `/assets/mock/schedule.json`
- `/assets/mock/settings.json`
- `/assets/mock/amazon-import.json`
- `/assets/mock/integration-logs.json`

## Notes
- All data is mock JSON. Replace `DataService` with real APIs later.
- Routes are configured in `src/app/app.routes.ts`.
