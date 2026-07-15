# Vital Gym Contract Management System

This repository contains a premium contract management application for Vital Gym, built with React (frontend) and Laravel / MySQL (backend).

## Structure

- `backend/` - Laravel API backend with Sanctum authentication, contract workflow, real-time notifications, and Excel export.
- `frontend/` - React + Tailwind UI with separate admin and sales portals, dark mode glassmorphism theme, and gamified sales dashboard.

## Quick Start

### Backend
1. `cd backend`
2. `composer install`
3. Copy `.env.example` to `.env` and configure `DB_*`
4. `php artisan key:generate`
5. `php artisan migrate`
6. `php artisan serve`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Notes

- Sales agent login: `/sales/login`
- Admin login: `/admin/login`
- Admin payments review hub: `/admin/payments`
- Auth routes use Laravel Sanctum and role-based middleware.
- Notifications are broadcast through a private channel for admin updates.
