# Project Changelog

---

## [2026-05-27 15:07] — Remove Landing Pricing and Map Glass Effects

- **Branch**: `feat/UI`
- **Prompt**: User asked to remove pricing from the landing page and remove all glassmorphism effects from the map page while keeping the defined theme.
- **Changes**:
  - Removed the pricing nav item, pricing data, and pricing section from the landing page.
  - Added a solid `map-surface` utility for map workspace panels.
  - Replaced glass/translucent map workspace surfaces with solid theme surfaces in the app navbar, filters dropdown, user menu, sidebar, result cards, home map panels, chat widget, map overlay, and map popups.
  - Removed `backdrop-blur`, `surface-panel`, and translucent `bg-white/[opacity]` classes from map-related components.
  - Verified the landing page no longer contains Pricing and reran the frontend build.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — landing content structure changed and the map workspace styling convention changed from frosted glass to solid theme surfaces.

---

## [2026-05-27 14:45] — Redesign Landing and Shared Accommodation Theme

- **Branch**: `feat/UI`
- **Prompt**: User requested a premium SaaS-style landing page inspired by withbobbin.com, adapted to an AI-powered accommodation booking/search product, with shared Tailwind theme tokens and consistent styling across landing, auth, dashboard/search, detail, profile, forms, modals, map popups, and states.
- **Changes**:
  - Added reusable Tailwind tokens for warm base colors, primary/accent colors, typography, larger radii, spacing, and shadow scales.
  - Added global component classes for sections, cards, glass panels, buttons, inputs, badges, and headings.
  - Rebuilt the public landing page with SaaS nav, hero, product mockup, social proof, features, alternating content sections, workflow, prompt demo, trust/security, testimonials, pricing, FAQ, sign-in CTA, and footer.
  - Applied the same visual language to login, app navbar/search filters, sidebar surfaces, accommodation cards, home search states, place detail surfaces, profile page, Q&A cards/forms, tag modal, map popups, chat widget opacity classes, and protected-route loading.
  - Changed `AuthProvider` so public routes render immediately while protected routes still guard on Firebase auth loading.
  - Ran the frontend build and browser screenshot checks for landing and login pages.
- **Modified files**:
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/pages/LoginPage.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/pages/PlaceDetailPage.jsx`
  - `frontend/src/pages/ProfilePage.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/src/components/QASection.jsx`
  - `frontend/src/components/TagPlaceModal.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/ProtectedRoute.jsx`
  - `frontend/src/contexts/AuthContext.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — introduced a reusable frontend theme system and changed public/protected auth rendering behavior.

---

## [2026-05-27 07:15] — Fix Frosted Background Classes for Filter and Account

- **Branch**: `feat/UI`
- **Prompt**: User reported search filter and account surfaces looked fully transparent and text was hard to read.
- **Changes**:
  - Replaced non-standard `bg-white/86` opacity classes with Tailwind arbitrary opacity `bg-white/[0.86]` for reliable CSS generation.
  - Applied the fix to sidebar panel/body, search filter dropdown, account button, and account dropdown.
  - Kept `ChatWidget` unchanged.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual CSS class correction only.

---

## [2026-05-27 07:08] — Match Non-Chat Surfaces to Chatbox Frosted Style

- **Branch**: `feat/UI`
- **Prompt**: User said the near-solid opacity removed the frosted glass effect and requested matching the chatbox style without changing the chatbox.
- **Changes**:
  - Reverted sidebar panel/body to chatbox-like `bg-white/86`, `border-white/70`, and blur styling.
  - Reverted search filter dropdown to chatbox-like `bg-white/86`, `border-white/70`.
  - Reverted account button/dropdown to the same frosted style.
  - Did not modify `ChatWidget`.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 07:05] — Equalize Filter, Sidebar, and Account Surface Opacity

- **Branch**: `feat/UI`
- **Prompt**: User said search filters, sidebar, and personal/account controls still have different opacity and the account button is too transparent.
- **Changes**:
  - Set sidebar panel and body to `bg-white/[0.98]`.
  - Set search filter dropdown to `bg-white/[0.98]`.
  - Set account button and account dropdown to `bg-white/[0.98]`.
  - Matched the main borders to `border-white/90` for these surfaces.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 07:01] — Match Sidebar, Search Filter, and Account Opacity

- **Branch**: `feat/UI`
- **Prompt**: User reported sidebar briefly appears transparent before becoming opaque, and search filter/account controls remain too transparent.
- **Changes**:
  - Removed opacity animation from sidebar open/close so it does not fade from transparent to opaque.
  - Increased sidebar panel/body opacity to match the frosted opaque style.
  - Increased search filter dropdown opacity and removed opacity fade from its animation.
  - Increased account button and dropdown opacity to match the search filter/sidebar surfaces.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 06:49] — Standardize Frosted Glass Opacity

- **Branch**: `feat/UI`
- **Prompt**: User reported inconsistent glass UI opacity and requested all glass surfaces look more opaque.
- **Changes**:
  - Increased opacity of sidebar body, place cards actions, detail subpanels, chat widget panels, message bubbles, form area, chatbot trigger, user menu trigger, and floating map controls.
  - Reduced overly transparent glass treatments so the map workspace uses a consistent frosted/opaque look.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual consistency refinement only.

---

## [2026-05-27 06:45] — Pin Search Bar to the Right

- **Branch**: `feat/UI`
- **Prompt**: User requested the search bar be placed on the right from the start and not resize or move when the sidebar changes.
- **Changes**:
  - Removed the dynamic `searchOffset` prop and sidebar-driven search movement.
  - Pinned the desktop search/filter area to the right side of the navbar using auto margin.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout behavior correction only.

---

## [2026-05-27 06:42] — Correct Search Offset Direction

- **Branch**: `feat/UI`
- **Prompt**: User clarified that the search bar should move right, not appear shifted left.
- **Changes**:
  - Restored the navbar search area's original desktop margins.
  - Changed sidebar-open movement to use positive `translateX` so the search/filter area moves right from its original position.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout correction only.

---

## [2026-05-27 06:39] — Offset Search Bar When Sidebar Opens

- **Branch**: `feat/UI`
- **Prompt**: User reported the sidebar overlaps the search filter dropdown and requested moving search slightly to the right.
- **Changes**:
  - Added a `searchOffset` prop to the authenticated `Navbar`.
  - Shifted the desktop search/filter area right when the sidebar is open, based on sidebar width.
  - Kept a smaller default desktop offset when the sidebar is closed.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout behavior refinement only.

---

## [2026-05-27 06:35] — Improve Main App Navbar Color

- **Branch**: `feat/UI`
- **Prompt**: User requested improving the main page navbar because it lacked color and looked weak.
- **Changes**:
  - Updated authenticated app navbar to use a stronger slate/blue/cyan gradient while preserving the glass effect.
  - Improved logo treatment, subtitle copy, search input contrast, filter button active color, and user menu trigger styling.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual refinement only.

---

## [2026-05-27 06:21] — Align Landing Page Copy with Accommodation Discovery Product

- **Branch**: `feat/UI`
- **Prompt**: User clarified that the project focuses on helping users find suitable accommodations through a chatbot and interactive place environment, and asked to read docs before rewriting the intro page.
- **Changes**:
  - Read product docs covering accommodation discovery, RAG chatbot per accommodation, Q&A, presence, user contributions, and hybrid recommendations.
  - Rewrote landing page hero copy around chatbot-guided accommodation search rather than generic travel planning.
  - Updated feature cards to describe natural-language accommodation needs, hybrid ranking, place-specific Q&A/chatbot, and on-site/community interaction.
  - Updated preview panel examples to use hotels, homestays, and resorts.
  - Updated login/security copy to emphasize remembered accommodation search context and saved place interactions.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — content and product positioning update only.

---

## [2026-05-27 05:20] — Switch Map Renderer to Mapbox GL

- **Branch**: `feat/UI`
- **Prompt**: User requested switching the map implementation to Mapbox.
- **Changes**:
  - Added `mapbox-gl` frontend dependency.
  - Replaced the Leaflet-based `MapComponent` with a Mapbox GL implementation.
  - Preserved existing map props and workflows for places, saved places, POIs, selected markers, directions, user location, fit bounds, focus target, and follow-current-location behavior.
  - Added clustered Mapbox point layers, route line layers, and user location layers.
  - Added support for official Mapbox styles via `VITE_MAPBOX_ACCESS_TOKEN`, with OSM/CARTO raster tile fallback when no token is set.
  - Updated frontend `.env.example` and README to document Mapbox usage.
- **Modified files**:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/.env.example`
  - `frontend/README.md`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: Yes — frontend map rendering changed from Leaflet/react-leaflet to Mapbox GL.

---

## [2026-05-27 04:01] — Refine Map Colors and Chat Entry Behavior

- **Branch**: `feat/UI`
- **Prompt**: User requested the map page logo return to `/`, removal of neon styling, stronger map page colors, a transparent chatbot button, and automatic chatbot opening on app load.
- **Changes**:
  - Updated authenticated navbar logo click behavior from `/app` to `/`.
  - Set the floating chatbot to open by default when the app loads.
  - Restyled the chatbot trigger as a translucent glass button instead of a saturated neon-style button.
  - Strengthened the map workspace visual contrast with darker glass navbar/sidebar headers, clearer white glass panels, and more saturated slate/sky accents.
  - Adjusted search result cards, loading states, detail panels, and location controls to feel less washed out while preserving the glass effect.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — UI behavior and visual refinement only.

---

## [2026-05-27 03:54] — Redesign App Icon and Glass Map UI

- **Branch**: `feat/UI`
- **Prompt**: User requested a redesigned app icon without neon colors, plus a refreshed map page UI using a glass effect.
- **Changes**:
  - Replaced the neon gradient favicon with a flatter Smacco map-pin icon using slate, cyan, and amber accents.
  - Updated the authenticated app navbar to use a softer translucent glass surface.
  - Restyled map page overlays, action buttons, search result states, and detail panels with glassmorphism treatment.
  - Updated sidebar and place result cards to use translucent backgrounds, blurred panels, soft borders, and more cohesive depth.
  - Adjusted the floating chat widget styling to better match the glass map workspace.
- **Modified files**:
  - `frontend/public/favicon.svg`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/SidebarOverlay.jsx`
  - `frontend/src/components/PlaceCard.jsx`
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/pages/HomePage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual design and branding refinement only.

---

## [2026-05-27 03:44] — Unify Public UI Theme

- **Branch**: `feat/UI`
- **Prompt**: User liked the new intro page but requested consistent colors across pages and a more polished UI.
- **Changes**:
  - Reworked `LandingPage` from the previous green/cream palette to the app's slate/blue/cyan visual system.
  - Improved landing page visual polish with stronger hero contrast, glass panels, cyan primary actions, refined feature cards, and a more cohesive map preview.
  - Rebuilt the legacy `/login` page with the same dark slate/cyan theme, matching form controls, improved right-side preview, and consistent entry points back to the public landing/app.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/pages/LoginPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual design refinement only.

---

## [2026-05-27 03:29] — Add Public Overview Landing Page

- **Branch**: `feat/UI`
- **Prompt**: User requested a general introduction page before entering the main map application, with login, feature overview, important footer links, and explanation of what the website offers.
- **Changes**:
  - Added a public `LandingPage` at `/` with Smacco hero content, feature summaries, visual map preview, embedded email/Google login, security notes, and footer navigation.
  - Moved the protected map application route from `/` to `/app`.
  - Updated successful login redirects to `/app`.
  - Updated unauthenticated protected-route redirects and logout behavior to return users to the public landing page.
  - Updated the authenticated navbar logo action to stay inside the app at `/app`.
- **Modified files**:
  - `frontend/src/App.jsx`
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/ProtectedRoute.jsx`
  - `frontend/src/pages/LoginPage.jsx`
- **Created files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Deleted files**: —
- **Architecture impact**: Yes — frontend routing now has a public landing route at `/` and the protected main application entry at `/app`.

---
