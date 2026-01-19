# Merchandiser Users Credentials

## Overview
This document contains login credentials and hierarchy information for all merchandiser users in the ERP system.

**Default Password for All Users:** `Password123`

> ⚠️ **Important:** Users should change their password on first login for security.

---

## User Hierarchy

```
Director (HEAD)
└── Senior Merchandisers
    ├── Assistant Merchandisers (Abdullah Ata)
    ├── Assistant Merchandisers (Jahanzaib Taj)
    └── Assistant Merchandisers (Jaseem)
```

---

## Director (HEAD)

| Email | Username | Role | Password | Manager |
|-------|----------|------|----------|---------|
| shahid.aazmi@horizonsourcing.net.pk | shahid.aazmi | DIRECTOR | Password123 | None |

**Name:** Shahid Aazmi

---

## Senior Merchandisers

All Senior Merchandisers report to the Director (Shahid Aazmi).

| Email | Username | Role | Password | Manager |
|-------|----------|------|----------|---------|
| jaseem.akhtar@horizonsourcing.net.pk | jaseem.akhtar | SENIOR_MERCHANDISER | Password123 | shahid.aazmi@horizonsourcing.net.pk |
| jahanzaib.taj@horizonsourcing.net.pk | jahanzaib.taj | SENIOR_MERCHANDISER | Password123 | shahid.aazmi@horizonsourcing.net.pk |
| sajjad.mashkoor@horizonsourcing.net.pk | sajjad.mashkoor | SENIOR_MERCHANDISER | Password123 | shahid.aazmi@horizonsourcing.net.pk |
| abdullah@horizonsourcing.net.pk | abdullah | SENIOR_MERCHANDISER | Password123 | shahid.aazmi@horizonsourcing.net.pk |

**Names:**
- Jaseem Akhtar
- Jahanzaib Taj
- Sajjad Mashkoor
- Abdullah

---

## Assistant Merchandisers

### Assistant Merchandisers of Abdullah Ata

All report to Abdullah (abdullah@horizonsourcing.net.pk).

| Email | Username | Role | Password | Manager |
|-------|----------|------|----------|---------|
| m.raza@horizonsourcing.net.pk | m.raza | ASSISTANT_MERCHANDISER | Password123 | abdullah@horizonsourcing.net.pk |
| zeeshan.ahmed@horizonsourcing.net.pk | zeeshan.ahmed | ASSISTANT_MERCHANDISER | Password123 | abdullah@horizonsourcing.net.pk |
| cs10@horizonsourcing.net.pk | cs10 | ASSISTANT_MERCHANDISER | Password123 | abdullah@horizonsourcing.net.pk |

**Names:**
- M. Raza
- Zeeshan Ahmed
- Fozan (cs10)

---

### Assistant Merchandisers of Jahanzaib Taj

All report to Jahanzaib Taj (jahanzaib.taj@horizonsourcing.net.pk).

| Email | Username | Role | Password | Manager |
|-------|----------|------|----------|---------|
| zuhair.zahid@horizonsourcing.net.pk | zuhair.zahid | ASSISTANT_MERCHANDISER | Password123 | jahanzaib.taj@horizonsourcing.net.pk |
| hammad.hussain@horizonsourcing.net.pk | hammad.hussain | ASSISTANT_MERCHANDISER | Password123 | jahanzaib.taj@horizonsourcing.net.pk |
| sami.khan@horizonsourcing.net.pk | sami.khan | ASSISTANT_MERCHANDISER | Password123 | jahanzaib.taj@horizonsourcing.net.pk |
| cs3@horizonsourcing.net.pk | cs3 | ASSISTANT_MERCHANDISER | Password123 | jahanzaib.taj@horizonsourcing.net.pk |
| syed.sohaib@horizonsourcing.net.pk | syed.sohaib | ASSISTANT_MERCHANDISER | Password123 | jahanzaib.taj@horizonsourcing.net.pk |

**Names:**
- Zuhair Zahid
- Hammad Hussain
- Sami Khan
- Daniyal Saleem (cs3)
- Syed Sohaib

---

### Assistant Merchandisers of Jaseem

All report to Jaseem Akhtar (jaseem.akhtar@horizonsourcing.net.pk).

| Email | Username | Role | Password | Manager |
|-------|----------|------|----------|---------|
| cs2@horizonsourcing.net.pk | cs2 | ASSISTANT_MERCHANDISER | Password123 | jaseem.akhtar@horizonsourcing.net.pk |
| cs8@horizonsourcing.net.pk | cs8 | ASSISTANT_MERCHANDISER | Password123 | jaseem.akhtar@horizonsourcing.net.pk |
| zohaib.ansari@horizonsourcing.net.pk | zohaib.ansari | ASSISTANT_MERCHANDISER | Password123 | jaseem.akhtar@horizonsourcing.net.pk |
| abdul.rehman@horizonsourcing.net.pk | abdul.rehman | ASSISTANT_MERCHANDISER | Password123 | jaseem.akhtar@horizonsourcing.net.pk |

**Names:**
- Farman Khan (cs2)
- Zeeshan Alam (cs8)
- Zohaib Ansari
- Abdul Rehman

---

### Assistant Merchandisers of Sajjad Mashkoor

All report to Sajjad Mashkoor (sajjad.mashkoor@horizonsourcing.net.pk).

| Email | Username | Role | Password | Manager |
|-------|----------|------|----------|---------|
| cs13@horizonsourcing.net.pk | cs13 | ASSISTANT_MERCHANDISER | Password123 | sajjad.mashkoor@horizonsourcing.net.pk |
| cs5@horizonsourcing.net.pk | cs5 | ASSISTANT_MERCHANDISER | Password123 | sajjad.mashkoor@horizonsourcing.net.pk |
| fakhar.alam@horizonsourcing.net.pk | fakhar.alam | ASSISTANT_MERCHANDISER | Password123 | sajjad.mashkoor@horizonsourcing.net.pk |
| adil.raza@horizonsourcing.net.pk | adil.raza | ASSISTANT_MERCHANDISER | Password123 | sajjad.mashkoor@horizonsourcing.net.pk |
| cs14@horizonsourcing.net.pk | cs14 | ASSISTANT_MERCHANDISER | Password123 | sajjad.mashkoor@horizonsourcing.net.pk |

**Names:**
- Talha Hussain (cs13)
- Usama (cs5)
- Fakhar Aalam (fakhar.alam)
- Adil Raza (adil.raza)
- Nadeem Ali (cs14)

---

## Summary Statistics

- **Total Users:** 22
- **Director:** 1
- **Senior Merchandisers:** 4
- **Assistant Merchandisers:** 17

---

## Role Permissions

### DIRECTOR
- Full access to all merchandiser functions
- Can view all jobs and reports
- Can assign jobs to any merchandiser
- Can approve/reject job submissions
- System administration access

### SENIOR_MERCHANDISER
- Can view and manage jobs assigned to them
- Can assign jobs to their assistant merchandisers
- Can view reports for their team
- Can approve/reject submissions from assistants

### ASSISTANT_MERCHANDISER
- Can view jobs assigned to them
- Can submit jobs for review
- Can view their own reports
- Limited to jobs assigned by their senior merchandiser

---

## Login Instructions

1. Navigate to the ERP system login page
2. Enter your email address as the username
3. Enter the default password: `Password123`
4. Click "Login"
5. **Important:** Change your password immediately after first login

---

## Password Reset

If a user forgets their password, contact the system administrator to reset it.

---

## Notes

- All users are created with `isActive = true`
- Manager relationships are stored in the `manager_id` column (if available)
- Users can be identified by their email address (unique)
- Usernames are extracted from email addresses (part before @)

---

## Script Usage

To create or update these users, run:

```bash
node create-merchandiser-users.js
```

The script will:
- Create new users if they don't exist
- Update existing users with new roles and manager relationships
- Hash passwords using bcrypt
- Display a verification table after completion

---

**Last Updated:** 2025-12-17  
**Created By:** ERP System Administrator

