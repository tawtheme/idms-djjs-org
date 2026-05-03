# idms-djjs-org

An Angular 18 application for DJJS volunteer and sewa management. Provides modules for visitors, volunteers, sewa allocation, programs, attendance, branches, departments, projects, initiatives, roles, and reporting.

## Prerequisites
- Node 18+
- npm 9+

## Run
```bash
npm install
npm run dev
```
App runs at http://localhost:4200

## Build
```bash
npm run build
npm start
```
The production build is served from `dist/idms-djjs-org/browser` on port 4200.

## Scripts
- `npm run dev` — Angular dev server with live reload
- `npm run build` — production build (with raised Node memory limit)
- `npm run watch` — development build in watch mode
- `npm start` / `npm run serve:prod` — serve the built bundle via `serve`
- `npm test` — Karma + Jasmine unit tests

## Tech Stack
- Angular 18 (standalone components, lazy-loaded routes)
- Angular Material + CDK
- Hugeicons
- ngx-image-cropper for profile image handling
- @zxing for barcode/QR scanning
- RxJS

## Structure
- `src/app/app.routes.ts` — route configuration with `authOnly` / `guestOnly` guards
- `src/app/services/auth.service.ts` — authentication state and guards
- `src/app/services/header-actions.service.ts` — shared header actions
- `src/app/features/*` — standalone feature screens (lazy-loaded)
- `src/assets/img` — static images
- `src/assets/scss` — global styles

## Feature Modules

**Authentication**
- Login, Forgot Password, Reset Password

**People Management**
- Visitors (list, create, view, edit)
- Volunteers (list, create, view, edit, branch applications, resigned sewas, volunteer cards)

**Programs & Sewa**
- All Sewa, Allocate Sewa
- Programs (list, add, edit, view, sewa volunteers)
- Attendances (list and detail)

**Administration**
- Roles, Initiatives, Projects
- Branches (list, create, areas)
- Departments
- Master Tables

**Reports**
- Programs, Volunteers by Branch & Sewa, Consecutive Absentees, Cards Returned, Donations (department-wise), Volunteer Skills, Sewa Issued, Head/Subhead Volunteers, Volunteer Attendance, Volunteer Count by Department

## Routing Notes
- Default route redirects to `/dashboard`.
- Authenticated routes are protected by the `authOnly` guard; auth screens use `guestOnly`.
- Unknown paths fall back to `/dashboard`.
