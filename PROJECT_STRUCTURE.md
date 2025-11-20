# Project Structure

Complete folder structure and flow of the idms-djjs-org application.

```
amazon-print/
│
├── src/                                    # Source code directory
│   ├── app/                               # Main application code
│   │   ├── app.component.ts               # Root component
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts                  # Application configuration
│   │   ├── app.routes.ts                  # Route definitions
│   │   ├── data.service.ts                # HTTP service for JSON data
│   │   ├── models.ts                     # TypeScript interfaces/models
│   │   │
│   │   ├── features/                     # Feature modules (standalone components)
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.component.ts/html/scss
│   │   │   │
│   │   │   ├── orders/                    # Orders feature
│   │   │   │   ├── orders.component.ts/html/scss
│   │   │   │   ├── detail/
│   │   │   │   │   └── order-detail.component.ts/html/scss
│   │   │   │   └── add-order/            # Add order feature
│   │   │   │       ├── add-order.component.ts/html/scss
│   │   │   │       └── add-item/         # Add item component (nested)
│   │   │   │           ├── add-item.component.ts/html/scss
│   │   │   │
│   │   │   ├── jobs/
│   │   │   │   ├── jobs.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── job-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── catalog/                  # Catalog feature
│   │   │   │   └── items/                # Items management
│   │   │   │       ├── items.component.ts/html/scss
│   │   │   │       └── add-edit-item/
│   │   │   │           └── add-edit-item.component.ts/html/scss
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── customers.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── customer-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── suppliers/
│   │   │   │   ├── suppliers.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── supplier-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── invoices/
│   │   │   │   ├── invoices.component.ts/html/scss
│   │   │   │   ├── create-invoice/
│   │   │   │   │   └── create-invoice.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── invoice-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── quotes/
│   │   │   │   ├── quotes.component.ts/html/scss
│   │   │   │   ├── create-quote/
│   │   │   │   │   └── create-quote.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── quote-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── purchase-orders/
│   │   │   │   ├── purchase-orders.component.ts/html/scss
│   │   │   │   ├── create-purchase-order/
│   │   │   │   │   └── create-purchase-order.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── purchase-order-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── shipments/
│   │   │   │   ├── shipments.component.ts/html/scss
│   │   │   │   └── detail/
│   │   │   │       └── shipment-detail.component.ts/html/scss
│   │   │   │
│   │   │   ├── settings/                 # Settings feature
│   │   │   │   ├── settings.component.ts/html/scss
│   │   │   │   ├── company-information/
│   │   │   │   │   └── company-information.component.ts/html/scss
│   │   │   │   ├── preferences/
│   │   │   │   │   └── preferences.component.ts/html/scss
│   │   │   │   └── notifications/
│   │   │   │       └── notifications.component.ts/html/scss
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── users.component.ts/html/scss
│   │   │   │   └── user-detail/
│   │   │   │       └── user-detail.component.ts/html/scss
│   │   │   │
│   │   │   └── amazon/                  # Amazon integration
│   │   │       ├── import/
│   │   │       │   └── import.component.ts/html/scss
│   │   │       ├── status-sync/
│   │   │       │   └── status-sync.component.ts/html/scss
│   │   │       └── logs/
│   │   │           └── logs.component.ts/html/scss
│   │   │
│   │   └── shared/                      # Shared/reusable components
│   │       ├── components/
│   │       │   ├── breadcrumb/
│   │       │   │   └── breadcrumb.component.ts/html/scss
│   │       │   ├── dropdown/
│   │       │   │   └── dropdown.component.ts/html/scss
│   │       │   ├── datepicker/
│   │       │   │   └── datepicker.component.ts/html/scss
│   │       │   ├── modal/
│   │       │   │   └── modal.component.ts/html/scss
│   │       │   ├── side-panel/
│   │       │   │   └── side-panel.component.ts/html/scss
│   │       │   ├── snackbar/
│   │       │   │   └── snackbar.component.ts/html/scss
│   │       │   ├── pager/
│   │       │   │   └── pager.component.ts/html/scss
│   │       │   ├── empty-state/
│   │       │   │   └── empty-state.component.ts/html/scss
│   │       │   └── menu-dropdown/
│   │       │       └── menu-dropdown.component.ts/html/scss
│   │       │
│   │       └── layouts/                 # Layout components
│   │           ├── header/
│   │           │   └── header.component.ts/html/scss
│   │           ├── sidenav/
│   │           │   └── sidenav.component.ts/html/scss
│   │           └── main-layout/
│   │               └── main-layout.component.ts/html/scss
│   │
│   ├── assets/                           # Static assets
│   │   ├── mock/                         # Mock JSON data files
│   │   │   ├── settings.json
│   │   │   ├── items.json
│   │   │   ├── orders.json
│   │   │   ├── order-details.json
│   │   │   ├── customers.json
│   │   │   ├── customers_detail.json
│   │   │   ├── suppliers.json
│   │   │   ├── suppliers_detail.json
│   │   │   ├── invoices.json
│   │   │   ├── invoices_detail.json
│   │   │   ├── quotes.json
│   │   │   ├── quotes_detail.json
│   │   │   ├── jobs.json
│   │   │   ├── job-details.json
│   │   │   ├── purchase-orders.json
│   │   │   ├── purchase-orders_detail.json
│   │   │   ├── shipments.json
│   │   │   ├── shipments_detail.json
│   │   │   ├── users.json
│   │   │   ├── user-details.json
│   │   │   ├── create-invoice.json
│   │   │   ├── create-quote.json
│   │   │   ├── create-purchase-order.json
│   │   │   ├── create-job.json
│   │   │   ├── amazon-import.json
│   │   │   └── checklists.json
│   │   │
│   │   └── scss/                         # Global SCSS files
│   │       ├── variable.scss             # SCSS variables
│   │       ├── form.scss                 # Form styles
│   │       ├── grid.scss                 # Grid system
│   │       └── ...                       # Other global styles
│   │
│   ├── styles.scss                       # Main stylesheet
│   ├── main.ts                          # Application entry point
│   └── index.html                       # HTML template
│
├── angular.json                          # Angular CLI configuration
├── package.json                          # NPM dependencies and scripts
├── tsconfig.json                         # TypeScript configuration
├── tsconfig.app.json                     # App-specific TS config
└── README.md                             # Project documentation
```

## Key Directories Explained

### `/src/app/features/`
Contains all feature modules. Each feature is a standalone component with its own:
- **Component files**: `.ts`, `.html`, `.scss`
- **Sub-components**: Nested in subdirectories (e.g., `detail/`, `add-order/`, `add-item/`)

**Feature Structure Pattern:**
```
feature-name/
├── feature-name.component.ts/html/scss    # Main component
├── detail/                                 # Detail view component
│   └── feature-name-detail.component.ts/html/scss
└── create-*/ or add-*/                    # Create/Add components
    └── create-feature-name.component.ts/html/scss
```

### `/src/app/shared/`
Reusable components and utilities used across features:
- **Components**: Dropdown, Modal, Side Panel, Datepicker, etc.
- **Layouts**: Header, Sidebar, Main Layout

### `/src/assets/mock/`
Mock JSON data files used for demo/testing:
- All data is loaded via `DataService.getJson<T>(path)`
- Files are automatically copied to `/assets/mock/` in build output
- No API server needed - all data comes from these static files

### `/src/assets/scss/`
Global SCSS files:
- **variable.scss**: Color variables, spacing, typography
- **form.scss**: Form input styles
- **grid.scss**: Grid system utilities

## Data Flow

```
User Action
    ↓
Component (Feature)
    ↓
DataService.getJson<T>(path)
    ↓
HTTP GET /assets/mock/{path}.json
    ↓
JSON Response
    ↓
Component receives data
    ↓
Display in template
```

## Component Communication Flow

### Parent → Child (Input)
```typescript
// Parent component
<app-child [data]="parentData"></app-child>

// Child component
@Input() data: SomeType;
```

### Child → Parent (Output)
```typescript
// Child component
@Output() dataChange = new EventEmitter<SomeType>();
this.dataChange.emit(newData);

// Parent component
<app-child (dataChange)="onDataChange($event)"></app-child>
```

## Routing Flow

```
app.routes.ts
    ↓
Route Definition
    ↓
Lazy Load Component
    ↓
Feature Component Loads
    ↓
Component fetches data via DataService
    ↓
Renders template
```

## Build Output Structure

After `npm run build:prod`:

```
dist/idms-djjs-org/
├── index.html
├── main.[hash].js
├── polyfills.[hash].js
├── styles.[hash].css
├── assets/
│   ├── mock/                    # All JSON files copied here
│   │   ├── settings.json
│   │   ├── items.json
│   │   └── ...
│   └── ...
└── favicon.ico
```

## Key Files

| File | Purpose |
|------|---------|
| `app.routes.ts` | Defines all application routes |
| `app.config.ts` | Application configuration (providers, etc.) |
| `data.service.ts` | HTTP service for loading JSON files |
| `models.ts` | TypeScript interfaces and types |
| `angular.json` | Angular CLI build configuration |
| `package.json` | Dependencies and npm scripts |

## Naming Conventions

- **Components**: `kebab-case.component.ts` (e.g., `add-order.component.ts`)
- **Services**: `kebab-case.service.ts` (e.g., `data.service.ts`)
- **Interfaces**: `PascalCase` (e.g., `OrderData`, `Customer`)
- **Files**: `kebab-case` (e.g., `order-detail.component.html`)
- **Directories**: `kebab-case` (e.g., `add-order/`, `order-detail/`)

## Feature Module Pattern

Each feature follows this pattern:

1. **List Component**: Shows list of items (e.g., `orders.component.ts`)
2. **Detail Component**: Shows single item details (e.g., `order-detail.component.ts`)
3. **Create/Add Component**: Form to create new item (e.g., `add-order.component.ts`)
4. **Nested Components**: Sub-components within a feature (e.g., `add-item/` inside `add-order/`)

## Example: Orders Feature Flow

```
orders.component.ts (List)
    ↓
Click "View" → Navigate to /orders/{id}
    ↓
order-detail.component.ts (Detail View)
    ↓
Click "New Order" → Open Modal/Side Panel
    ↓
add-order.component.ts (Form)
    ↓
Uses add-item.component.ts (Nested Component)
    ↓
Submit → Save to JSON (or API in future)
```

