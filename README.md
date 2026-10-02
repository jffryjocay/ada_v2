# Authority to Debit Account (ADA) System v2.0

Converted fullstack application:
- **Frontend**: Vue.js 3 + Vite + Pinia + Vue Router
- **Backend**: Node.js + Express.js + SQLite (`ada.db`)
- **Location**: `Desktop/ada_v2`

---

## ?? How to Run the System

### Option 1: Double-Click Executable Batch File (Recommended)
Double-click `run.bat` located inside `Desktop/ada_v2`. This will:
1. Start the Node.js backend server on `http://localhost:5000`
2. Start the Vue.js frontend server on `http://localhost:3000`
3. Automatically launch your default web browser to `http://localhost:3000`

### Option 2: Run via NPM Command
Open your terminal in `Desktop/ada_v2` and run:
```bash
npm start
```

---

## ?? Default Login Accounts

| Username | Password | Role | Employee Name | Position |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `admin` | **Admin** | Abu Jahhil L. Modiarat, CPA, MPA | Chief, Fund Management Division |
| `encoder` | `encoder` | **Encoder** | Jeff | Information Officer I |
| `reviewer` | `reviewer` | **Reviewer** | Jeff | Clerk |

---

## ?? Features Overview

1. **User Authentication & Role Control**: Login/logout system with role permissions.
2. **ADA Record Management (Appendix 36)**:
   - Create, list, edit date, and delete ADA entries.
   - Auto-generated ADA numbers (`<account_suffix>-<YYYYMM>-<count>`).
   - Admin option to overwrite ADA numbers.
   - Itemized reference, nature of payment, CAFOA, and amount entry.
   - Automatic number-to-words conversion for total amounts (e.g., *Twelve Thousand Pesos & 50/100 Only*).
3. **Summary & RADAI Reports (Appendix 37)**:
   - Date range filtering (Daily, As of, Periodic).
   - Fund selection (General, School, Trust, Calamity, Custom).
   - Account number selection.
   - Transaction history log and print report generator.
4. **Default Settings & Signatories**:
   - Addressee, Bank, Account No.
   - ADA Authorized Signatories (Left & Right).
   - RADAI Authorized Signatory.
5. **Account Management**:
   - Add/delete user accounts (Admin only).
