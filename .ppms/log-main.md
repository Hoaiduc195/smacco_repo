# Project Changelog

---

## [2026-05-22 08:45] — Rebrand Application Name and Icon to Smacco

- **Branch**: `main`
- **Prompt**: User requested "đổi tên và icon thành Smacco" (change name and icon to Smacco).
- **Changes**:
  - **Frontend Branding**:
    - Created a new, highly professional and modern glowing SVG logo for Smacco at `frontend/public/favicon.svg` combining an abstract map-pin shape and a stylized 'S' curve.
    - Updated `frontend/index.html` title tag to `Smacco — Lập kế hoạch du lịch & Khám phá địa điểm thông minh`, updated meta description, and changed favicon to the new SVG logo.
    - Updated `Navbar.jsx` to replace the default MapPin icon with our custom Smacco logo (`/favicon.svg`) and changed the text to `Smacco` styled with a premium gradient.
    - Updated `PlaceDetailPage.jsx` footer with the Smacco logo and updated copyrights and description texts.
    - Updated `frontend/package.json` package name to `smacco-frontend`.
  - **Backend & Environment**:
    - Updated NestJS bootstrap in `backend/src/main.ts` Swagger API Title to `Smacco API` and changed terminal startup message to `Smacco Monolith`.
    - Updated container names in `docker-compose.yml` to `smacco-frontend`, `smacco-backend`, and `smacco-postgres` and updated default database name to `smacco_db`.
    - Updated `DATABASE_URL` in both `backend/.env` and `backend/.env.example` to point to `smacco_db`.
    - Updated package name in `backend/package.json` to `smacco-monolith`.
- **Modified files**:
  - `frontend/index.html`
  - `frontend/package.json`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `backend/src/main.ts`
  - `backend/package.json`
  - `backend/.env`
  - `backend/.env.example`
  - `docker-compose.yml`
- **Created files**:
  - `frontend/public/favicon.svg`
  - `.ppms/architecture-main.md`
  - `.ppms/log-main.md`
- **Deleted files**: —
- **Architecture impact**: No — branding change and environment container renames.

---
