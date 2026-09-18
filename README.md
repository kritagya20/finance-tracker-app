# Personal Finance Tracker

A privacy-focused, local-first personal finance application for managing transactions, accounts, budgets, investments, loans, financial goals, and overall financial health.

The primary goal of this project is to build a finance application where users can manage their financial information without having to send their complete financial history to a central server.

The application should work offline, keep core financial computation on the user's device, and provide cloud synchronization only when the user chooses to use it.

---

# 1. Project Objective

Most finance applications follow a server-centric model:

```text
User
  |
  v
Application
  |
  v
Backend
  |
  v
Database
```

This approach makes synchronization and centralized processing easier, but it also means the application provider potentially stores sensitive information such as:

* Transactions
* Bank account balances
* Salary
* Investments
* Loans
* Credit card information
* Financial goals
* Net worth
* Receipts and financial documents

This project takes a different approach.

The application will follow a **local-first architecture**.

The user's financial data should primarily live on the user's device. Financial calculations such as balances, budgets, spending analysis, net worth, and financial reports should be performed locally.

The backend will mainly be responsible for services that genuinely require infrastructure, such as:

* Authentication
* Optional synchronization
* Encrypted backups
* Device management
* Application configuration
* Notifications
* Non-sensitive application metadata

The objective is not to eliminate the backend, but to minimize the amount of sensitive financial information that the backend needs to know.

---

# 2. Core Principles

## 2.1 Local First

The application should remain usable without an internet connection.

The following operations should not require the backend:

* Adding transactions
* Editing transactions
* Viewing accounts
* Calculating balances
* Viewing budgets
* Viewing spending reports
* Calculating net worth
* Tracking goals
* Viewing historical data
* Searching transactions

For example:

```text
Add Transaction
      |
      v
Local Database
      |
      v
Finance Engine
      |
      v
Updated Financial State
```

The user should not experience a loss of core functionality simply because the backend or internet connection is unavailable.

---

## 2.2 Privacy First

Financial data is more sensitive than the majority of data stored by normal applications.

The application should follow a data-minimization approach.

If a calculation can be performed locally, it should be performed locally.

If a piece of information does not need to be sent to the backend, it should not be sent.

If cloud synchronization is enabled, sensitive data should be encrypted before it leaves the device where the architecture permits.

---

## 2.3 User-Owned Data

The user should be able to:

* Export their financial data
* Create backups
* Restore backups
* Move data between devices
* Delete their data
* Delete their account
* Use the application without being forced to enable cloud synchronization

The application should not intentionally create a situation where users cannot retrieve their own financial history.

---

## 2.4 Security by Design

Security should be considered while designing the system rather than added after the core application is complete.

The architecture should account for:

* Database breaches
* Account takeover
* Stolen devices
* Rooted or jailbroken devices
* API attacks
* Broken authorization
* Session theft
* Replay attacks
* Synchronization attacks
* Malicious imports
* Dependency vulnerabilities
* Insider access
* Backup exposure
* Sensitive information appearing in logs

---

# 3. High-Level Architecture

The planned architecture is:

```text
                         User Device
                              |
                +-------------+-------------+
                |                           |
                v                           v
          Application                Secure Key Storage
                |
        +-------+--------+
        |                |
        v                v
  Finance Engine    Encrypted SQLite
        |
        v
  Financial State
        |
        +----------------------+
                               |
                     Optional Synchronization
                               |
                               v
                         Go Backend
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
            PostgreSQL                    Redis
```

The local application is the primary source for financial computation.

The backend should not be required to calculate the user's financial state.

---

# 4. Technology Stack

## Backend

* Go
* REST API
* PostgreSQL
* Redis

The backend will provide APIs for:

* Authentication
* User management
* Device management
* Synchronization
* Backup management
* Notifications
* Application configuration

---

## Client

The client should support multiple platforms rather than being limited to a web application.

The initial direction is to use a cross-platform client framework such as Flutter.

Target platforms:

* Android
* iOS
* Web
* Desktop where practical

The exact client implementation may change, but the financial domain should remain independent of the UI framework.

---

## Local Storage

SQLite will be used as the local database.

The local database will contain the user's financial information and should be encrypted.

Conceptually:

```text
Application
     |
     v
Finance Engine
     |
     v
Encrypted SQLite
```

---

# 5. Finance Engine

The finance engine is one of the most important parts of the application.

It should contain the actual financial rules and calculations rather than putting them inside the UI or API layer.

The finance engine should be:

* Deterministic
* Independently testable
* Offline-capable
* Independent of the UI
* Independent of HTTP
* Independent of PostgreSQL
* Independent of Redis

Conceptually:

```text
Transactions
Accounts
Budgets
Goals
Loans
Investments
        |
        v
Finance Engine
        |
        +------> Account Balances
        |
        +------> Budgets
        |
        +------> Net Worth
        |
        +------> Financial Goals
        |
        +------> Reports
        |
        +------> Financial Insights
```

---

# 6. Financial Data Model

## Accounts

The application should support:

* Bank accounts
* Savings accounts
* Cash
* Wallets
* Credit cards
* Debit accounts
* Fixed deposits
* Investment accounts
* Loans
* Custom accounts

Example:

```text
Account
├── ID
├── Name
├── Type
├── Currency
├── Opening Balance
├── Current Balance
├── Institution
├── Status
└── Transactions
```

---

# 7. Transactions

The transaction model should support:

* Income
* Expense
* Transfer
* Refund
* Cash withdrawal
* Cash deposit
* Credit card payment
* Balance adjustment

Example:

```text
Transaction
├── ID
├── Account ID
├── Amount
├── Currency
├── Type
├── Category
├── Merchant
├── Date
├── Notes
├── Tags
├── Attachments
├── Recurring Reference
└── Created / Updated timestamps
```

---

# 8. Split Transactions

A single real-world transaction should be capable of being divided into multiple categories.

Example:

```text
Supermarket
Total: ₹2,000

Food:        ₹800
Household:   ₹500
Personal:    ₹400
Other:       ₹300
```

This allows users to accurately categorize a purchase without creating artificial transactions.

---

# 9. Recurring Transactions

Recurring transactions should support:

* Salary
* Rent
* EMI
* Insurance
* Subscriptions
* Bills
* Investments
* Allowances

Example:

```text
Salary
Amount: ₹80,000
Frequency: Monthly
Date: 1st
```

The application should maintain upcoming recurring transactions locally.

---

# 10. Budgeting

Users should be able to create:

* Weekly budgets
* Monthly budgets
* Yearly budgets
* Custom-period budgets
* Category-specific budgets

Example:

```text
Food

Budget:     ₹10,000
Spent:       ₹7,200
Remaining:  ₹2,800
Used:           72%
```

Planned functionality:

* Budget rollover
* Spending limits
* Budget alerts
* Overspending detection
* Historical budget comparison

---

# 11. Financial Goals

Users should be able to create goals such as:

* Emergency fund
* Vacation
* Car
* House
* Education
* Wedding
* Retirement
* Custom goals

Example:

```text
Emergency Fund

Target:       ₹3,00,000
Current:      ₹1,80,000
Remaining:    ₹1,20,000
Progress:           60%
Target Date:  December 2027
```

The application should calculate the required periodic saving based on the target amount, current progress, and target date.

---

# 12. Debt Management

Support for:

* Credit cards
* Personal loans
* Education loans
* Home loans
* BNPL
* Other liabilities

Example:

```text
Loan

Principal:       ₹5,00,000
Outstanding:     ₹3,72,000
Interest Rate:       10.5%
EMI:              ₹12,500
Next Payment:     05 Sep
```

Potential functionality:

* EMI calculation
* Interest calculation
* Outstanding balance tracking
* Prepayment analysis
* Debt snowball
* Debt avalanche

---

# 13. Investment Tracking

The initial objective is investment tracking rather than investment trading.

Potential asset types:

* Stocks
* Mutual funds
* ETFs
* Bonds
* Fixed deposits
* Gold
* Crypto
* PPF
* EPF
* NPS

Example:

```text
Portfolio

Equity:        ₹4,20,000
Mutual Funds:  ₹3,10,000
Gold:          ₹1,25,000
FD:            ₹2,00,000

Total:        ₹10,55,000
```

The system should track:

* Invested amount
* Current value
* Profit/loss
* Returns
* Asset allocation
* Historical performance

---

# 14. Net Worth

The application should calculate net worth locally.

```text
Assets
├── Bank Accounts
├── Cash
├── Investments
├── Fixed Deposits
└── Other Assets

Liabilities
├── Credit Cards
├── Loans
├── BNPL
└── Other Liabilities

Net Worth = Assets - Liabilities
```

Historical net worth should also be maintained so users can see how their financial position changes over time.

---

# 15. Dashboard

The dashboard should provide a summary of the user's financial position.

Example:

```text
Net Worth
₹7,42,350

Income
₹85,000

Expenses
₹52,300

Savings
₹32,700

Savings Rate
38.4%
```

Additional information can include:

* Spending by category
* Monthly spending trends
* Income trends
* Savings trends
* Upcoming recurring expenses
* Debt
* Investment allocation
* Goal progress

---

# 16. Search and Filtering

As transaction history grows, search becomes an important feature.

Examples:

```text
All Amazon transactions

Transactions above ₹10,000

Food spending in July

Transactions from a particular account

Transactions between ₹5,000 and ₹10,000
```

Filters should include:

* Date
* Amount
* Account
* Category
* Merchant
* Tags
* Transaction type
* Currency

Search should operate against the local database whenever possible.

---

# 17. Import and Export

Users should be able to import existing financial data.

Initial formats:

* CSV
* Excel
* Supported bank statements

The preferred flow is:

```text
CSV / Statement
      |
      v
Local Parser
      |
      v
Normalization
      |
      v
Duplicate Detection
      |
      v
Category Mapping
      |
      v
Local Database
```

The same principle should apply to bank statement processing wherever practical.

The application should not require users to upload their financial statements to a remote server just to import them.

---

# 18. Smart Categorization

Transaction categorization should initially use a rule-based system.

Example:

```text
SWIGGY
  -> Food

UBER
  -> Transport

NETFLIX
  -> Entertainment
```

Over time the system can learn user-specific rules.

Potential future approaches:

* Merchant rules
* User-defined rules
* Local machine learning
* Merchant normalization
* Automatic categorization

Any machine learning approach should be evaluated with privacy as a requirement.

---

# 19. Subscription Tracking

The application should identify recurring subscriptions and show their financial impact.

Example:

```text
Monthly Subscriptions

Netflix:       ₹649
Spotify:       ₹119
YouTube:       ₹149
Gym:         ₹1,500
AWS:           ₹800

Monthly Total: ₹3,217
Annual Total: ₹38,604
```

The application can also identify subscriptions whose cost has increased or that have not been used recently, where sufficient local data is available.

---

# 20. Financial Documents

Transactions may contain:

* Receipts
* Invoices
* Bank statements
* Bills
* Warranty documents

Documents should preferably be stored locally and encrypted.

For cloud backup:

```text
Document
   |
   v
Encrypt Locally
   |
   v
Encrypted Upload
   |
   v
Cloud Storage
```

The backend should not need access to the original document.

---

# 21. Financial Insights

The application should provide useful financial insights without requiring external AI services.

Example:

```text
Your spending increased by ₹4,900 this month.

Food increased by ₹2,400.
Shopping increased by ₹1,800.
Transport increased by ₹700.
```

These insights can initially be generated using deterministic calculations.

Future functionality may include:

* Spending explanations
* Budget recommendations
* Financial questions
* Goal planning
* Scenario analysis
* Optional AI assistance

External AI processing, if introduced, should be opt-in and clearly explain what data is being shared.

---

# 22. Financial Health Score

A financial health score can provide a high-level view of the user's financial position.

Example:

```text
Financial Health: 78 / 100

Savings:          82
Debt:             65
Emergency Fund:   90
Budgeting:        74
Investments:      79
```

The calculation should be transparent.

For example:

```text
+15  Emergency fund > 6 months
+12  Savings rate > 25%
+10  No overdue payments
-8   High credit utilization
-5   Increasing discretionary spending
```

The score should be presented as an informational metric, not financial advice.

---

# 23. Scenario Planning

Users should eventually be able to evaluate hypothetical financial situations.

Examples:

```text
What happens if I buy a ₹10 lakh car?

What happens if my salary increases by 20%?

Can I afford a ₹25,000 EMI?

How long will it take to build a ₹5 lakh emergency fund?

What happens if I increase my monthly investment by ₹10,000?
```

These calculations should run against local financial data.

---

# 24. Privacy Architecture

The application will classify data based on sensitivity.

## Highly Sensitive

```text
Transactions
Bank balances
Salary
Investment values
Loans
Net worth
Financial goals
Receipts
Bank statements
```

These should remain local whenever possible.

If they need to be synchronized, they should be encrypted before leaving the device.

## Less Sensitive

```text
Account metadata
Application settings
Device information
Feature configuration
```

Only information that is actually required by the backend should be sent.

---

# 25. Local Encryption

The local database should be encrypted.

Conceptually:

```text
Financial Data
      |
      v
Encryption
      |
      v
Encrypted SQLite
```

Encryption keys should be protected using platform-provided secure storage mechanisms.

Keys should not be stored in:

* Plain files
* SQLite
* Shared preferences
* Source code
* Logs
* Application configuration

---

# 26. Key Management

The application should use a key hierarchy rather than a single key stored alongside the data.

Conceptually:

```text
                Root Key
                   |
          +--------+--------+
          |                 |
     Device Key A      Device Key B
          |                 |
        Phone             Laptop
          |
          v
    Data Encryption Key
          |
          v
    Encrypted Finance Data
```

The exact implementation needs to be finalized before implementing synchronization.

Key management is considered a security-critical component and should receive additional review.

---

# 27. Cloud Synchronization

Cloud synchronization will be optional.

Without synchronization:

```text
Device
  |
  v
Encrypted Local Database
```

With synchronization:

```text
Device
  |
  v
Encrypt
  |
  v
Encrypted Data
  |
  v
Go API
  |
  v
PostgreSQL / Object Storage
```

The server should store encrypted financial information rather than plaintext financial information wherever possible.

---

# 28. Multi-Device Synchronization

The eventual goal is to support:

```text
Phone
  <---->
Laptop
  <---->
Tablet
```

The synchronization system needs to handle offline modifications and conflicts.

Potential synchronization metadata:

```text
Event ID
Device ID
Entity ID
Event Type
Version
Timestamp
Encrypted Payload
```

Example events:

```text
TRANSACTION_CREATED
TRANSACTION_UPDATED
TRANSACTION_DELETED

ACCOUNT_CREATED
ACCOUNT_UPDATED
ACCOUNT_DELETED
```

The synchronization layer should provide:

* Idempotency
* Conflict detection
* Conflict resolution
* Replay protection
* Version tracking
* Device revocation

---

# 29. Security Threat Model

The application will explicitly consider the following threats.

## Database Breach

An attacker obtains the PostgreSQL database.

Mitigations:

* Encrypt sensitive data before synchronization
* Encrypt backups
* Minimize stored financial information
* Use least-privilege database access

---

## Stolen Device

An attacker obtains the user's device.

Mitigations:

* Device authentication
* Application PIN
* Biometrics
* Automatic lock
* Encrypted local database
* Secure key storage

---

## Account Takeover

An attacker obtains the user's credentials.

Mitigations:

* Strong password hashing
* MFA
* Short-lived access tokens
* Refresh-token rotation
* Session management
* Rate limiting
* Device management

---

## Broken Object Authorization

Example:

```text
GET /transactions/123
```

An attacker changes the ID to:

```text
GET /transactions/124
```

and attempts to access another user's transaction.

Every API request involving user-owned resources must verify ownership server-side.

Client-provided IDs must never be considered proof of ownership.

---

## SQL Injection

Mitigations:

* Parameterized queries
* Input validation
* Safe database access patterns
* Least-privilege database users
* Automated security testing

---

## Brute Force

Redis can be used for:

* Login rate limiting
* IP throttling
* Device throttling
* OTP attempt tracking

---

## Session Theft

Mitigations:

* Short-lived access tokens
* Refresh token rotation
* Secure token storage
* Session revocation
* Device management

---

## Replay Attacks

Synchronization requests should use:

* Unique event IDs
* Idempotency keys
* Version numbers
* Nonces where applicable
* Server-side replay detection

---

## Sync Tampering

Authenticated encryption should be used so that changes to encrypted synchronization payloads are detected.

---

## Malicious Imports

CSV, Excel, PDF, and other imported files should be treated as untrusted input.

Controls should include:

* File validation
* File size limits
* Safe parsing
* Input sanitization
* Duplicate detection
* Protection against spreadsheet formula injection

---

## Sensitive Logs

Financial data should never be written to application logs.

Bad:

```text
Transaction:
amount=50000
merchant=ABC
account=123456
```

Preferred:

```text
Transaction created:
transaction_id=abc123
```

---

## Telemetry

Analytics should not contain:

* Transaction amounts
* Bank account information
* Salary
* Investment values
* Merchant descriptions
* Financial documents

Technical telemetry should be limited to what is actually required.

---

# 30. Backend Security

The Go backend should follow a layered security model:

```text
Internet
   |
   v
TLS
   |
   v
Rate Limiting
   |
   v
Authentication
   |
   v
Authorization
   |
   v
Input Validation
   |
   v
Business Rules
   |
   v
Database
```

PostgreSQL and Redis should not be directly exposed to the public internet.

---

# 31. PostgreSQL Security

PostgreSQL should only be accessible through the backend/private network.

Security requirements:

* Private networking
* Strong authentication
* Least-privilege database roles
* TLS
* Encrypted storage
* Encrypted backups
* Regular security updates
* Audit logging

---

# 32. Redis Security

Redis may be used for:

* Rate limiting
* Session management
* Temporary synchronization state
* Background jobs
* Caching

Redis should:

* Not be publicly accessible
* Require authentication
* Use secure networking
* Have appropriate access controls
* Avoid storing unnecessary financial information

---

# 33. Secrets Management

Secrets must never be committed to Git.

Examples of secrets:

* Database credentials
* JWT signing keys
* Cloud credentials
* Third-party API credentials
* Service keys

The intended pattern is:

```text
Secret Manager
      |
      v
Runtime Environment
      |
      v
Go Application
```

---

# 34. Data Export

Users should have a complete data export capability.

Example:

```text
finance-export/
├── accounts.json
├── transactions.json
├── budgets.json
├── goals.json
├── investments.json
├── loans.json
└── attachments/
```

The export format should be documented and maintained as part of the application.

---

# 35. Data Deletion

Users should be able to delete their account and associated cloud data.

Deletion should consider:

```text
Primary Database
Backups
Encrypted Objects
Sessions
Devices
Caches
Logs
```

Retention policies should be documented before the application reaches production.

---

# 36. Money Representation

Financial calculations should avoid inappropriate floating-point arithmetic.

For currencies such as INR, monetary values can be represented using integer minor units.

Example:

```text
₹100.50
```

can internally be represented as:

```text
10050 paise
```

The chosen money representation must be consistent across:

* Finance engine
* Local database
* API
* Backend
* Reports
* Client

Currency-specific rules must also be considered for currencies that do not use two decimal places.

---

# 37. Multi-Currency

Transactions should preserve their original values.

A transaction such as:

```text
AED 500
```

should retain:

```text
Original Amount: 500
Original Currency: AED
Transaction Date: ...
```

Currency conversion should be handled separately.

The original transaction should never be replaced by a converted value.

---

# 38. Testing Strategy

Testing will be divided into several levels.

```text
Unit Tests
     |
     v
Integration Tests
     |
     v
End-to-End Tests
     |
     v
Security Tests
```

The finance engine should have particularly strong unit test coverage.

Important scenarios include:

* Transaction calculations
* Transfers
* Refunds
* Split transactions
* Recurring transactions
* Budget calculations
* Budget rollover
* Goal calculations
* Net worth
* Loan calculations
* Investment calculations
* Currency handling
* Rounding
* Date boundaries
* Duplicate transactions
* Offline changes
* Synchronization conflicts

---

# 39. Security Testing

Security testing should be part of the development pipeline.

Planned checks:

* SAST
* DAST
* Dependency scanning
* Secret scanning
* Container scanning
* API security testing
* Authorization testing
* Authentication testing
* Rate-limit testing
* Dependency vulnerability scanning

The API should be tested against common API vulnerabilities, particularly broken authorization and object-level access control.

---

# 40. Repository Structure

The initial repository can follow this structure:

```text
finance-tracker/
│
├── README.md
│
├── backend/
│   ├── cmd/
│   ├── internal/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── investments/
│   │   ├── loans/
│   │   ├── sync/
│   │   ├── encryption/
│   │   └── notifications/
│   │
│   ├── migrations/
│   ├── pkg/
│   └── go.mod
│
├── client/
│   ├── lib/
│   │   ├── core/
│   │   ├── domain/
│   │   ├── data/
│   │   ├── finance_engine/
│   │   ├── encryption/
│   │   ├── sync/
│   │   └── presentation/
│   │
│   └── ...
│
├── docs/
│   ├── architecture/
│   ├── security/
│   ├── database/
│   ├── api/
│   └── sync/
│
└── tests/
```

The exact structure can change as implementation progresses.

---

# 41. Development Roadmap

The project should be developed in stages.

## Phase 1 — Financial Core

* [ ] Define domain models
* [ ] Define account model
* [ ] Define transaction model
* [ ] Implement local SQLite database
* [ ] Implement finance engine
* [ ] Implement accounts
* [ ] Implement transactions
* [ ] Implement categories
* [ ] Implement transfers
* [ ] Implement split transactions
* [ ] Implement local search
* [ ] Implement dashboard
* [ ] Verify complete offline operation

---

## Phase 2 — Security Foundation

* [ ] Define data classification
* [ ] Implement local database encryption
* [ ] Implement secure key storage
* [ ] Implement application PIN
* [ ] Implement biometric authentication
* [ ] Implement automatic locking
* [ ] Define authentication architecture
* [ ] Implement secure backend authentication
* [ ] Implement authorization
* [ ] Implement rate limiting
* [ ] Establish secure logging rules
* [ ] Establish secrets management

---

## Phase 3 — Personal Finance Features

* [ ] Budgets
* [ ] Recurring transactions
* [ ] Subscription tracking
* [ ] Financial goals
* [ ] Notifications
* [ ] Net worth
* [ ] Reports
* [ ] CSV import
* [ ] CSV export
* [ ] Smart categorization

---

## Phase 4 — Advanced Finance

* [ ] Loans
* [ ] Credit card management
* [ ] EMI calculations
* [ ] Debt management
* [ ] Investment tracking
* [ ] Portfolio analytics
* [ ] Financial health score
* [ ] Scenario planning
* [ ] Historical financial analysis

---

## Phase 5 — Secure Synchronization

* [ ] Device registration
* [ ] Device keys
* [ ] Key hierarchy
* [ ] Encrypted synchronization
* [ ] Event-based synchronization
* [ ] Conflict detection
* [ ] Conflict resolution
* [ ] Replay protection
* [ ] Device revocation
* [ ] Encrypted cloud backup
* [ ] Recovery mechanism

---

## Phase 6 — Advanced Features

* [ ] Bank statement parsing
* [ ] Advanced categorization
* [ ] Spending anomaly detection
* [ ] Financial insights
* [ ] Multi-currency
* [ ] Family/shared finance
* [ ] Optional AI assistant
* [ ] Additional financial integrations

---

## Phase 7 — Production Readiness

* [ ] Security audit
* [ ] Penetration testing
* [ ] SAST
* [ ] DAST
* [ ] Dependency scanning
* [ ] Secret scanning
* [ ] Container scanning
* [ ] SBOM
* [ ] Backup recovery testing
* [ ] Disaster recovery plan
* [ ] Incident response plan
* [ ] Privacy policy
* [ ] Terms of service
* [ ] Data retention policy
* [ ] Data deletion policy
* [ ] Security disclosure process

---

# 42. Important Architectural Decisions

The following rules should guide implementation.

### 1. Financial logic does not belong in the UI.

The UI should call the finance domain/engine.

### 2. Financial logic does not depend on the backend.

The application must be capable of calculating its financial state locally.

### 3. Offline functionality is a requirement, not an enhancement.

The core application should work without network connectivity.

### 4. Sensitive data should not leave the device unnecessarily.

If a calculation can be performed locally, do it locally.

### 5. Cloud synchronization is optional.

The user should be able to use the application without cloud synchronization.

### 6. The backend should know as little as possible.

Only data required for authentication, synchronization, application functionality, and infrastructure should be stored.

### 7. Sensitive cloud data should be encrypted before transmission where appropriate.

The server should not automatically have access to plaintext financial data.

### 8. Encryption keys must be treated separately from encrypted data.

Storing the encryption key next to the encrypted data defeats much of the security model.

### 9. Financial information must never appear in logs.

Use IDs and operational metadata instead.

### 10. Never implement custom cryptography.

Use established cryptographic primitives and well-reviewed libraries.

---

# 43. Initial Milestone

The first meaningful milestone is not a complete finance application.

It is a working local finance engine.

The first version should be capable of:

```text
Create Account
      |
      v
Add Transaction
      |
      v
Update Account Balance
      |
      v
Calculate Spending
      |
      v
Calculate Budget
      |
      v
Calculate Net Worth
      |
      v
Display Dashboard
```

All of this should work:

```text
Without Internet
Without Backend
Without PostgreSQL
Without Redis
```

Once this works reliably, the backend and synchronization layers can be introduced without making them a dependency for the core product.

---

# 44. Current Project Status

**Status:** Active Client & Engine Development (React 19 Frontend + Local-First Architecture)

Current technology stack & architecture:

```text
Frontend:     React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
Backend:      Go
Database:     PostgreSQL (Cloud Sync / Backup)
Cache:        Redis
Local DB:     SQLite / IndexedDB (Zero-knowledge encrypted)
Money Unit:   64-bit Integer Minor Units (Paise: ₹1.00 = 100)
Architecture: Local-first, Offline-capable
Security:     Privacy-first, Zero-knowledge, Biometric & MPIN Authenticated
```

## 44.1 Implemented Frontend Architecture

The client application is built with React 19, TypeScript, and Tailwind CSS, adhering strictly to [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md):

1. **Navigation Structure**:
   - 4 primary tabs: **Home** (`House`), **Activity** (`Activity`), **Analytics** (`ChartColumn`), and **Profile** (`User`), with an elevated center FAB for quick transaction creation (`+`).
   - Primary bottom navigation tabs omit top-left back navigation buttons.
   - Drill-down sub-screens, settings sub-pages, and bottom drawers use a single, non-conflicting `ArrowLeft` back button.

2. **CRED-Inspired Profile Hub**:
   - Centralized account management, security controls, payment methods, categories, and application preferences.
   - Clean, capitalized section headers without cluttered count badges.
   - Native Dark / Light theme toggle with persisted theme tokens.

3. **Bank-Grade Credential Modification (Change MPIN)**:
   - Complete security isolation: Personal profile editing (Name, Email, Phone) is strictly decoupled from MPIN modifications.
   - Dedicated 4-stage drawer workflow:
     1. **Security Challenge**: Biometrics (`Fingerprint`) or SMS OTP challenge verification.
     2. **Enter New MPIN**: Obfuscated 4-digit or 6-digit numeric input (`font-mono`).
     3. **Confirm New MPIN**: Two-step validation preventing mismatch errors.
     4. **Success State**: Visual confirmation with haptic-aligned feedback and session persistence.

4. **Deterministic Integer Financial Engine**:
   - Strictly handles all currency values as 64-bit integer paise (minor units, e.g. ₹500.00 = `50000`), completely eliminating IEEE-754 floating-point rounding errors.
   - Multi-category transaction splitting and real-time budget threshold monitoring.


---

# 45. Long-Term Objective

The long-term objective is to build a complete personal finance platform rather than another expense tracking application.

The application should eventually allow a user to:

```text
Track
  |
  +-- Transactions
  +-- Accounts
  +-- Investments
  +-- Loans
  +-- Subscriptions

Plan
  |
  +-- Budgets
  +-- Goals
  +-- Debt
  +-- Retirement
  +-- Scenarios

Understand
  |
  +-- Spending Trends
  +-- Savings
  +-- Net Worth
  +-- Financial Health
  +-- Financial Insights

Protect
  |
  +-- Local Encryption
  +-- Secure Backup
  +-- End-to-End Encryption
  +-- Device Management
  +-- Data Export
```

The application should provide useful financial functionality while keeping the user's financial information under the user's control.

---

# 46. Project Statement

The core idea behind the project is simple:

> **Build a personal finance application that works locally, keeps financial computation on the user's device, provides optional encrypted synchronization, and gives users complete control over their financial data.**
