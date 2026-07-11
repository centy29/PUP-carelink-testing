# 🏥 PUPBC CareLink - Setup Guide

> Para sa mga kagrupo na magse-setup ng project sa kanilang laptop.

---

## 📋 Requirements

| Software | Download Link |
|----------|---------------|
| **WAMP Server** (MySQL 9.1.0) | https://www.wampserver.com/ |
| **Node.js** (v18+) | https://nodejs.org/ |
| **Composer** (PHP) | https://getcomposer.org/ |
| **Git** | https://git-scm.com/ |

---

## 🚀 Step 1: Download Project

```bash
git clone https://github.com/YOUR_USERNAME/pupbc-carelink.git
cd pupbc-carelink

Step 2: Setup Database
2.1 Open WAMP
Start WAMP Server (icon should turn green)

Click WAMP icon → phpMyAdmin

2.2 Create Database
sql
CREATE DATABASE pupbc_carelink_v3;

2.3 Import SQL File
Kung may backup file (database/pupbc_backup_xxxx.sql), import mo sa phpMyAdmin

Or run migrations:

bash
cd backend
php artisan migrate


⚙️ Step 3: Setup Backend
bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
copy .env.example .env

# Generate app key
php artisan key:generate

# Run backend
php -S 0.0.0.0:8000 -t public
Update .env file:
env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pupbc_carelink_v3
DB_USERNAME=root
DB_PASSWORD=


🎨 Step 4: Setup Frontend
bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev


📱 Step 5: Access the App
User	URL
Laptop	http://localhost:3000
Phone (same WiFi)	http://192.168.1.X:3000
🔑 Test Accounts
Student
text
Student ID: 2023-00057-BN-0
Birthday: 09/24/2004
Password: Marc@0924
Nurse
text
URL: http://localhost:3000/carelink-portal
Email: pupbc.clinic@iskolarngbayan.pup.edu.ph
Password: Clinic@2024


📁 Project Structure
text
pupbc-carelink/
├── backend/          # Laravel API (PHP)
├── frontend/         # React App (JavaScript)
├── database/         # Backup scripts
├── docs/             # Documentation
└── README.md