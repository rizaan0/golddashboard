# PROJECT MASTER SPECIFICATION
# Gold Savings Scheme Management System

## 1. Project Overview

Develop a secure, modern, responsive web application for a jewellery business owner to manage customers participating in an 11-month gold savings scheme.

The application is intended exclusively for the business owner to maintain customer records, track monthly installment payments, monitor scheme completion, archive completed schemes, restart schemes, and generate financial collection reports.

This is an internal business record-management system. It is NOT an e-commerce platform.

The application must prioritize:
- Accurate financial records.
- Simple and efficient data entry.
- Secure access to business data.
- Clear scheme progress tracking.
- Preservation of historical transactions.
- A clean, uncluttered dashboard.
- Reliable weekly, monthly, and yearly reports.

## 2. Core Business Requirements

### 2.1 Gold Savings Scheme

Each customer can participate in an 11-month gold savings scheme.

Every customer has their own scheme start date and installment schedule.

The monthly installment amount is fixed for that particular customer and can differ between customers.

Examples:
- Customer A: ₹500 per month.
- Customer B: ₹1,000 per month.
- Customer C: ₹2,000 per month.

The scheme duration is 11 installments.

Example:
- Monthly installment: ₹1,000.
- Number of installments: 11.
- Total amount upon completion: ₹11,000.

The application must track the amount paid, not calculate the gold quantity or gold valuation.

The application does not need to determine how much gold the customer receives upon maturity. That decision is handled manually by the business owner.

### 2.2 Installment Payment Rules

Each installment must be paid in full.

Partial or half installment payments are NOT permitted.

For example, if a customer's monthly installment is ₹1,000:
- ₹1,000 received: mark installment as paid.
- ₹500 received: do not mark the installment as paid.

The owner manually records each payment.

The application must:
- Display all 11 installments.
- Display the installment amount.
- Display the scheduled due date.
- Display payment status.
- Record the actual payment date.
- Calculate total amount collected.
- Calculate remaining installments.
- Calculate remaining amount.
- Prevent duplicate payment entries for the same installment.

Payment status should include:
- Upcoming.
- Due.
- Paid.
- Overdue.

An installment becomes overdue only after its due date has passed and it remains unpaid.

The owner must be able to manually record and correct payment information with appropriate validation and an audit trail.

## 3. Customer Management

The business owner must be able to create, view, search, and manage customers.

### Customer Information

Store the following:
- Customer ID.
- Full name.
- Phone number.
- Address (optional).
- Date of registration.
- Notes (optional).
- Customer status.

### Customer ID

Generate a unique, human-readable customer ID automatically.

Example:
- CUS-1001
- CUS-1002
- CUS-1003

The customer ID must remain unchanged even when the customer starts another scheme.

Use an internal database UUID as the primary key. The human-readable customer ID is used for identification in the UI.

### Customer Search

Provide search functionality using:
- Customer ID.
- Customer name.
- Phone number.

The search should be fast and responsive.

### Customer Details Page

Each customer must have a dedicated details page containing:
- Customer information.
- Current active scheme.
- Scheme progress.
- Monthly installment amount.
- Total amount collected.
- Remaining installments.
- Payment history.
- Previous completed or archived schemes.

## 4. Scheme Management

### 4.1 Create a New Scheme

The owner should be able to create a new scheme for a customer.

Required information:
- Customer.
- Monthly installment amount.
- Scheme start date.

The scheme duration should default to 11 months.

The application should automatically generate the installment schedule.

The schedule should follow the customer's individual start date.

Example:

If a scheme starts on January 10:

| Installment | Due Date | Amount |
|---|---|---:|
| 1 | January 10 | ₹1,000 |
| 2 | February 10 | ₹1,000 |
| 3 | March 10 | ₹1,000 |
| 4 | April 10 | ₹1,000 |
| 5 | May 10 | ₹1,000 |
| 6 | June 10 | ₹1,000 |
| 7 | July 10 | ₹1,000 |
| 8 | August 10 | ₹1,000 |
| 9 | September 10 | ₹1,000 |
| 10 | October 10 | ₹1,000 |
| 11 | November 10 | ₹1,000 |

The date generation logic must handle months with fewer days correctly.

### 4.2 Scheme Progress

Display scheme progress clearly.

Examples:
- 0/11 installments paid.
- 5/11 installments paid.
- 10/11 installments paid.
- 11/11 installments paid.

Provide a visual progress bar.

Display:
- Total scheme amount.
- Total amount collected.
- Remaining amount.
- Installments completed.
- Installments remaining.

### 4.3 Scheme Completion

When all 11 installments have been paid:

- Automatically mark the scheme as Completed.
- Display a green completion marker.
- Show a green tick icon.
- Display the total amount collected.
- Remove the scheme from active overdue/due tracking.
- Make the scheme eligible for archiving.

Example:

Customer: CUS-1001

Monthly installment: ₹1,000

Installments: 11/11

Total collected: ₹11,000

Status: ✓ Scheme Completed

The application must not automatically calculate or assign the quantity of gold received.

## 5. Completed Scheme Actions

After a scheme is completed, display three options:

### Green Tick Marker

The green tick represents the completed scheme status.

It is a visual status indicator, not a delete action.

### Archive Action

Provide a small archive/delete-style icon for completed schemes.

The owner can archive a completed scheme to remove it from the active dashboard and reduce clutter.

Important:
- Archiving must not permanently delete the customer.
- Archiving must not permanently delete the scheme.
- Archiving must not delete installment records.
- Archiving must not remove historical transactions from financial reports.
- Archived schemes must remain accessible from the customer's history and the archived schemes section.

Use a confirmation dialog before archiving.

### Restart New Scheme Action

Provide a "Restart New Scheme" button.

When clicked:
- Create a new scheme record for the same customer.
- Default the new scheme duration to 11 months.
- Allow the owner to set the new start date.
- Allow the owner to set the monthly installment amount.
- Generate a fresh installment schedule.
- Reset progress for the new scheme to 0/11.

Do NOT reset or overwrite the previous scheme.

The old scheme must remain completed and available in historical records.

A customer may have multiple completed schemes and one active scheme.

Do not allow multiple active schemes for the same customer unless explicitly enabled by the owner.

## 6. Dashboard

Create a clean, modern dashboard for the business owner.

### Dashboard Summary Cards

Display:

1. Total Customers.
2. Active Schemes.
3. Completed Schemes.
4. Total Collections Today.
5. Total Collections This Month.
6. Total Collections This Year.
7. Upcoming Installments.
8. Overdue Installments.

These values must be calculated from actual database records.

### Dashboard Sections

Include:
- Recent payment transactions.
- Upcoming installment payments.
- Overdue installments.
- Recently completed schemes.
- Recently added customers.
- Collection summary chart.

### Dashboard Filtering

Allow the owner to filter the dashboard by:
- Today.
- This Week.
- This Month.
- This Year.
- Custom Date Range.

Archived schemes should not appear in the active schemes list, but their historical payments must still be included in collection reports.

## 7. Payments and Transactions

Create a dedicated payments/collections section.

Every successfully recorded installment payment must create a permanent transaction record.

### Transaction Information

Store:
- Transaction ID.
- Customer ID.
- Scheme ID.
- Installment number.
- Amount received.
- Payment date.
- Payment method (optional).
- Notes (optional).
- Created timestamp.

### Payment Methods

Allow optional payment methods such as:
- Cash.
- UPI.
- Bank Transfer.
- Other.

The application must not integrate with payment gateways initially.

### Transaction History

Display:
- Customer name.
- Customer ID.
- Scheme ID.
- Installment number.
- Amount.
- Payment date.
- Payment method.
- Transaction ID.

Provide search and filtering by:
- Customer.
- Scheme.
- Date range.
- Payment method.

### Financial Data Integrity

Never physically delete a transaction merely to correct a mistake.

If a payment is entered incorrectly, provide a secure correction or reversal process that preserves an audit trail.

The application must prevent:
- Duplicate installment payments.
- Invalid amounts.
- Payments for already-paid installments.
- Payments associated with invalid schemes.
- Incorrect collection totals caused by archived schemes.

## 8. Reports and Analytics

The application must provide financial collection reports.

### Weekly Reports

Display:
- Total amount collected this week.
- Number of installments paid this week.
- Number of customers who paid this week.
- Daily collection breakdown for the week.

### Monthly Reports

Display:
- Total amount collected this month.
- Number of installments paid.
- Number of customers who paid.
- Monthly collection trend.
- Daily collection breakdown.

### Yearly Reports

Display:
- Total amount collected this year.
- Total installments paid.
- Monthly collection breakdown.
- Yearly collection trend.

### Custom Reports

Allow the owner to select a custom date range.

### Report Filters

Reports should support:
- Date range.
- Customer.
- Scheme status.
- Payment method.

### Important Financial Reporting Rule

Reports must use actual recorded payment dates, not scheduled installment due dates.

Archived and completed schemes must remain included in reports.

The reports represent money collected. Do not label collection totals as profit.

### Export Functionality

Allow the owner to export reports as:
- Excel (.xlsx).
- PDF.

Exports must contain the selected date range, report totals, and relevant transaction details.

## 9. Archived Schemes

Create a separate Archived Schemes section.

Display:
- Customer ID.
- Customer name.
- Scheme ID.
- Scheme start date.
- Scheme completion date.
- Monthly installment amount.
- Total amount collected.
- Scheme status.

Provide search and filters.

The owner must be able to open archived schemes and view their full installment history.

Archiving must be reversible if the owner chooses to restore a scheme.

Archived schemes must remain part of all relevant historical financial reports.

## 10. Authentication and Security

The application is intended for the business owner only.

### Authentication

Implement secure owner authentication.

Requirements:
- Login page.
- Logout functionality.
- Secure session management.
- Password hashing.
- Session expiration.
- Secure HTTP-only cookies.
- HTTPS in production.
- Server-side authentication checks.

### Access Control

There must be no public customer registration.

Only the authorized business owner should be able to access:
- Dashboard.
- Customer records.
- Scheme records.
- Transactions.
- Reports.
- Settings.

All protected pages and backend API endpoints must enforce authentication and authorization on the server side.

Do not rely solely on hiding UI elements.

### Security Requirements

- Validate all user inputs.
- Use server-side validation.
- Protect against SQL injection.
- Protect against unauthorized data access.
- Apply rate limiting to login attempts.
- Never expose database credentials to the frontend.
- Never expose authentication secrets in client-side code.
- Store secrets in environment variables.
- Use secure database access permissions.

The application must be private even though the website itself is publicly accessible through a domain.

## 11. Technical Architecture

Use the following recommended stack.

### Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Responsive UI components.

### Backend

- Next.js App Router.
- Server Actions and/or Route Handlers.
- Server-side business logic.
- Zod for validation.

### Database

- PostgreSQL.

Use a managed PostgreSQL database for production.

### ORM

Use Prisma ORM or Drizzle ORM.

Choose one ORM and use it consistently throughout the project.

### Authentication

Use a reliable authentication solution compatible with Next.js.

### Charts

Use a charting library such as Recharts for dashboard analytics.

### Export

Use appropriate libraries for:
- Excel exports.
- PDF generation.

### Repository

Use Git and a private GitHub repository.

## 12. Database Design

Design a normalized relational database.

Suggested tables:

### Users

Stores the owner account.

Fields:
- id (UUID).
- email.
- password hash or authentication provider reference.
- created_at.
- updated_at.

### Customers

Fields:
- id (UUID).
- customer_code.
- full_name.
- phone.
- address.
- notes.
- status.
- created_at.
- updated_at.
- archived_at (optional).

### Schemes

Fields:
- id (UUID).
- customer_id.
- scheme_code.
- monthly_installment_amount.
- duration_months.
- start_date.
- completion_date.
- total_amount.
- status.
- archived_at (optional).
- created_at.
- updated_at.

### Installments

Fields:
- id (UUID).
- scheme_id.
- installment_number.
- due_date.
- amount_due.
- status.
- paid_at.
- created_at.
- updated_at.

### Transactions

Fields:
- id (UUID).
- customer_id.
- scheme_id.
- installment_id.
- amount_received.
- payment_date.
- payment_method.
- notes.
- created_at.
- updated_at.

### Audit Logs

Fields:
- id (UUID).
- user_id.
- entity_type.
- entity_id.
- action.
- previous_values.
- new_values.
- created_at.

Use appropriate:
- Foreign keys.
- Unique constraints.
- Indexes.
- Database transactions.
- Data validation.

Use integer paise or an appropriate decimal type for financial values. Do not use floating-point numbers for monetary calculations.

A unique constraint must prevent multiple successful payments for the same installment.

The exact database schema may be refined during implementation, but the financial relationships must remain correct.

## 13. UI/UX Requirements

Create a professional, clean, modern business dashboard.

### Design Style

- Minimal and elegant.
- Professional jewellery-business aesthetic.
- Clean spacing.
- Readable typography.
- Subtle borders and shadows.
- Consistent color system.
- Responsive layout.
- Desktop-first but mobile-friendly.

Avoid:
- Excessive animations.
- Cluttered dashboards.
- Overly bright colors.
- Unnecessary decorative elements.
- Too many cards on one screen.

### Color Usage

Use a neutral base with restrained gold accents.

Use green for completed schemes.

Use red for overdue installments.

Use yellow/orange for due or upcoming installments.

### Navigation

Provide a sidebar with:

1. Dashboard.
2. Customers.
3. Gold Schemes.
4. Payments / Collections.
5. Reports.
6. Archived Schemes.
7. Settings.
8. Logout.

### Customer and Scheme UI

Use:
- Searchable tables.
- Status badges.
- Progress indicators.
- Clear action buttons.
- Confirmation dialogs.
- Pagination where appropriate.

### Responsive Behavior

The application should work properly on:
- Desktop.
- Laptop.
- Tablet.
- Mobile.

## 14. Deployment and Hosting

The application must be deployed as a live website accessible through a domain.

Recommended deployment:
- Next.js application hosted on a managed hosting platform such as Render.
- Managed PostgreSQL database.
- Private GitHub repository for source code.
- Custom domain if required.

The application must not depend on the developer's personal computer being switched on.

### Environment Variables

Use environment variables for:
- DATABASE_URL.
- AUTH_SECRET.
- Other required authentication or application secrets.

Never hardcode production credentials.

### Production Requirements

- HTTPS.
- Secure authentication.
- Production database.
- Database backups.
- Proper error handling.
- Logging.
- Environment separation between development and production.

### Deployment Workflow

1. Develop locally.
2. Test using development data.
3. Push code to a private GitHub repository.
4. Create the production database.
5. Configure environment variables.
6. Deploy the application.
7. Run database migrations.
8. Create the owner account securely.
9. Test the deployed application.
10. Configure the domain.
11. Verify security and data persistence.
12. Hand over the application to the client.

## 15. Backup and Data Recovery

Financial data must not be lost.

Implement:
- Automated database backups through the managed database provider.
- A documented backup retention policy.
- A restoration procedure.
- Export functionality for reports.

Do not treat Excel or PDF exports as a replacement for database backups.

## 16. Explicitly Excluded Features

Do NOT implement the following unless the client requests them later:

- Jewellery order management.
- E-commerce functionality.
- Online checkout.
- Inventory or stock management.
- POS system.
- Barcode scanning.
- Customer-facing dashboards.
- Public customer registration.
- Payment gateway integration.
- WhatsApp integration.
- Instagram integration.
- Online payment collection.
- Gold price tracking.
- Gold valuation calculations.
- Gold quantity or gram calculations.
- Automatic maturity benefit calculations.
- Multi-branch management.
- Multi-owner accounts.
- AI/ML features.
- Redis-based caching.
- Complex microservices architecture.

The application must remain focused on the gold savings scheme tracking requirements.

## 17. Development Phases

Develop the project incrementally.

### Phase 1 — Project Setup

- Initialize Next.js.
- Configure TypeScript.
- Configure Tailwind CSS.
- Configure the database.
- Configure ORM.
- Set up authentication.
- Create project structure.

### Phase 2 — Authentication

- Login page.
- Owner account setup.
- Protected routes.
- Secure session handling.
- Logout.

### Phase 3 — Customer Management

- Create customer.
- Generate customer ID.
- Customer listing.
- Customer search.
- Customer details page.
- Customer editing.

### Phase 4 — Scheme Management

- Create scheme.
- Generate 11 installments.
- Calculate due dates.
- Scheme progress tracking.
- Active scheme listing.
- Due and overdue statuses.

### Phase 5 — Payment Tracking

- Record full installment payment.
- Validate payment amount.
- Prevent duplicate payment.
- Update installment status.
- Update scheme progress.
- Update total collection values.

### Phase 6 — Scheme Completion and Archiving

- Automatic completion detection.
- Green completion marker.
- Archive action.
- Archived schemes section.
- Restore archived scheme.
- Restart New Scheme functionality.
- Preserve historical transactions.

### Phase 7 — Dashboard

- Summary cards.
- Recent transactions.
- Upcoming installments.
- Overdue installments.
- Collection charts.
- Date filters.

### Phase 8 — Reports

- Weekly reports.
- Monthly reports.
- Yearly reports.
- Custom date range reports.
- Excel export.
- PDF export.

### Phase 9 — UI Refinement

- Responsive design.
- UI consistency.
- Loading states.
- Error states.
- Empty states.
- Confirmation dialogs.
- Form validation.

### Phase 10 — Testing

Test:
- Customer creation.
- Unique customer ID generation.
- Scheme creation.
- Installment schedule generation.
- Payment recording.
- Duplicate payment prevention.
- Scheme completion.
- Archiving.
- Restoration.
- Restarting a new scheme.
- Historical transaction preservation.
- Weekly/monthly/yearly reports.
- Authentication and authorization.
- Production database persistence.

### Phase 11 — Deployment

- Deploy application.
- Configure production database.
- Configure environment variables.
- Run migrations.
- Set up backups.
- Configure domain.
- Perform final production testing.

## 18. Important Development Instructions

Before writing code:

1. Analyze the entire project specification.
2. Design the application architecture.
3. Design the database schema and relationships.
4. Define the financial data integrity rules.
5. Create a clear folder structure.
6. Create an implementation plan.

Do not attempt to build the entire application in one step.

Implement one phase at a time.

After each phase:
- Review the code.
- Test the functionality.
- Fix errors.
- Verify database relationships.
- Verify that financial calculations are correct.
- Ensure no previous functionality is broken.

Do not generate fake production data.

Use dummy data only in the development environment.

Avoid unnecessary abstractions, excessive dependencies, and overengineering.

Prioritize correctness, maintainability, security, and simplicity.

## 19. Final Expected Outcome

Deliver a fully functional, secure, responsive, deployed gold savings scheme management application.

The business owner must be able to:

- Log in securely.
- Add customers.
- Create individual 11-month gold savings schemes.
- Set different monthly installment amounts for different customers.
- Record installment payments.
- Track due and overdue installments.
- View scheme progress.
- Identify completed schemes through green status markers.
- Archive completed schemes without losing their records.
- Restart new schemes while retaining historical schemes.
- View weekly, monthly, and yearly collection reports.
- Export financial reports.
- Access the application from any device using the deployed domain.

The system must preserve all historical financial records even when customers or schemes are archived.

The primary objective is to provide the business owner with a simple, reliable, secure, and professional gold savings scheme tracking system.
