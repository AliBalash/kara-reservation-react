# Kara Reservation React

Kara Reservation React is a React and Vite reservation frontend built for a multi-step car-booking experience with RTL support and direct CRM API integration. It replaces a traditional server-rendered reservation page with a more interactive client-side flow.

## Highlights

- Step-based reservation wizard
- RTL-friendly responsive UI
- Real-time quote calculation against CRM endpoints
- Dynamic brand, model, and vehicle loading
- Validation feedback mapped from API responses
- Final reservation creation through public CRM APIs

## Tech Stack

- React
- Vite
- JavaScript
- RTL UI patterns

## Required Backend Endpoints

- `GET /api/public/reservations/bootstrap`
- `GET /api/public/reservations/brands`
- `GET /api/public/reservations/models`
- `GET /api/public/reservations/cars`
- `POST /api/public/reservations/quote`
- `POST /api/public/reservations`

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

- `VITE_API_BASE_URL`

Example default:

```env
VITE_API_BASE_URL=https://127.0.0.1:18001/api/public/reservations
```

## Build

```bash
npm run build
npm run preview
```

## Positioning

This repository is a focused frontend portfolio piece for reservation UX and CRM integration rather than a complete standalone product.

## Author

Developed by Ali Balash.
