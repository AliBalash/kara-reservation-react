# Kara Reservation React

Modern step-by-step reservation frontend built with React + Vite.

This app replaces the old Laravel/Livewire reservation page and consumes CRM APIs directly from `kara-panel`.

## Highlights

- 5-step wizard with full RTL responsive UI
- Live quote calculation from CRM (`/quote`) with debounce
- Dynamic brand/model/car loading from API
- Validation on both frontend and API response (422 mapping to fields)
- Final contract creation in CRM (`POST /api/public/reservations`)
- Date/time picker UX optimized for reservation flow

## Required CRM APIs

- `GET /api/public/reservations/bootstrap`
- `GET /api/public/reservations/brands`
- `GET /api/public/reservations/models`
- `GET /api/public/reservations/cars`
- `POST /api/public/reservations/quote`
- `POST /api/public/reservations`

## Environment

```bash
cp .env.example .env
```

Default (Docker CRM HTTPS endpoint):

```env
VITE_API_BASE_URL=https://127.0.0.1:18001/api/public/reservations
```

If your browser blocks local self-signed SSL, open `https://127.0.0.1:18001` once and allow it.

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```
