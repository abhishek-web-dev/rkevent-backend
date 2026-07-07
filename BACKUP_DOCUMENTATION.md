# Database Backup & Restore System Documentation

The RK Event Invoice Management System features a robust backup and restore architecture. This document explains the CLI command scripts, REST APIs, automatic scheduling, and integration with Google Drive.

---

## 1. CLI Usage

The system exposes two standard `npm` scripts in `package.json` to allow command-line data operations.

### Create Database Backup
Generates a JSON snapshot containing all database tables (`users`, `companySettings`, `customers`, `invoices`, `payments`, `activityLogs`) and saves it inside the `backups/` directory.
```bash
npm run backup
```
*Output File Format:* `backups/YYYY-MM-DD-HH-mm-backup.json` (e.g. `2026-07-02-15-32-backup.json`).

### Restore Database Backup
Restores the database to a selected snapshot. **Warning: This clears all existing tables before importing the snapshot.** It preserves all raw document IDs (`_id`) to maintain references/foreign keys.
```bash
npm run restore <filename>
```
*Example:*
```bash
npm run restore 2026-07-02-15-32-backup.json
```

---

## 2. API Documentation

System database snapshots can be managed via standard REST APIs under `/api/system/*`. All system endpoints are protected and restricted to users with the **admin** role.

### A. Trigger Manual Backup
- **URL:** `POST /api/system/backup`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Body:**
  ```json
  {
    "success": true,
    "data": {
      "file": "2026-07-02-15-32-backup.json"
    },
    "message": "Database backup created successfully"
  }
  ```

### B. List Available Snapshots
- **URL:** `GET /api/system/backups`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Body:**
  ```json
  {
    "success": true,
    "data": [
      "2026-07-02-15-32-backup.json",
      "2026-07-01-02-00-backup.json"
    ],
    "message": "Backups list retrieved successfully"
  }
  ```

### C. Trigger Database Restore
- **URL:** `POST /api/system/restore`
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request Body:**
  ```json
  {
    "file": "2026-07-02-15-32-backup.json"
  }
  ```
- **Response Body:**
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "message": "Database restored successfully",
      "file": "2026-07-02-15-32-backup.json"
    },
    "message": "Database restored successfully"
  }
  ```

---

## 3. Automated Backup Scheduler (Cron Job)

The backend features an automated background cron scheduler using `node-cron`. 
- **Trigger Frequency:** Every day at **2:00 AM** (cron schedule expression: `0 2 * * *`).
- **Initialization:** Starts automatically when the server boots.
- **Outcome:** Generates a new JSON snapshot locally and uploads it to Google Drive if configured.

---

## 4. Optional Google Drive Integration

Backup snapshots can be mirrored automatically to Google Drive. This integration requires **zero** external libraries and uses Google's standard OAuth2 and Drive REST API endpoints.

### Setup Environment Variables
Configure the following parameters in your `.env` file to enable Drive upload support:
```env
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_google_oauth_refresh_token
```

If these keys are left empty or omitted, the system will log a warning during backup and skip the upload process, keeping the backup stored locally in the `backups/` folder.
