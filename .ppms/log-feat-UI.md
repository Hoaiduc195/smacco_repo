# Project Changelog

---

## [2026-05-27 20:13] — Add Hover Interactions To Landing Page

- **Branch**: `feat/UI`
- **Prompt**: User requested hover effects on the landing page.
- **Changes**:
  - Added reusable hover utility classes in `index.css` for lift and glow interactions.
  - Applied hover motion to landing page navigation, hero CTAs, trust chips, feature cards, workflow cards, prompt demo buttons, testimonials, FAQ entries, auth summary cards, and footer links.
  - Added a subtle animated hover treatment to the hero map illustration elements so the preview feels more alive without becoming distracting.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — presentation-only update.

---

## [2026-05-27 20:01] — Snap Current Location To Fixed Zoom

- **Branch**: `feat/UI`
- **Prompt**: User requested that pressing the current-location button should always zoom the map to a chosen level.
- **Changes**:
  - Extended the map focus helper in `HomePage.jsx` with metadata so current-location centering can be identified separately from normal place focus.
  - Marked both the one-time geolocation jump and the continuous watch-position updates as `current-location` focus events.
  - Updated `MapComponent.jsx` to reset the follow-zoom latch when the focus target comes from current location, so Mapbox always snaps to the fixed zoom instead of keeping a prior zoom level.
- **Modified files**:
  - `frontend/src/pages/HomePage.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — interaction behavior only.

---

## [2026-05-27 20:01] — Smooth Map Filter Close Animation

- **Branch**: `feat/UI`
- **Prompt**: User reported a slight glitch when turning off the filter on the Mapbox frontend page.
- **Changes**:
  - Updated the advanced filter popover in `Navbar.jsx` to animate its closed state with `opacity` plus `transform`, instead of snapping on `visibility`.
  - Switched the filter toggle button to a functional state update so the open/close transition is more robust.
  - Deferred the "Áp dụng bộ lọc" search trigger by one animation frame so the close animation starts before any search work can re-render the page.
  - Replaced the `map.resize()` invalidation in `MapComponent.jsx` with `map.triggerRepaint()` so sidebar/filter state changes do not force an expensive Mapbox resize and create a small hitch.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/MapComponent.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — interaction smoothness and rendering behavior only.

---

## [2026-05-27 16:28] — Reposition Sidebar Open Button Further Down

- **Branch**: `feat/UI`
- **Prompt**: User requested to make the sidebar trigger button go even lower down the screen.
- **Changes**:
  - Shifted the vertical position of the rounded capsule sidebar open button in `SidebarOverlay.jsx` significantly lower down the left screen edge.
  - Positioned it at `top-64` (256px from top) on desktop and `top-72` (288px from top) on mobile.
  - This keeps the open trigger tab perfectly clear of top panels and ideally balanced inside the viewport vertical spacing.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout adjustment only.

---

## [2026-05-27 16:21] — Rounded Capsule Sidebar Open Button with Lower Positioning

- **Branch**: `feat/UI`
- **Prompt**: User clarified they wanted the sidebar open trigger button to be rounded (bo tròn) and positioned lower down (nằm xuống 1 tí).
- **Changes**:
  - Re-designed the sidebar open trigger button in `SidebarOverlay.jsx` to be a sleek half-capsule/rounded tab pointing right using the native `rounded-r-full` Tailwind class, removing the polygon clip-path completely.
  - Positioned the button lower down the left viewport edge (`top-32` = 128px on desktop and `top-36` = 144px on mobile) to keep it perfectly clear of other UI controls and extremely comfortable to access.
  - Centered a sharp white `ChevronRight` icon (`w-4 h-4`) inside this slim rounded capsule.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout refinement only.

---

## [2026-05-27 16:18] — Slim Down Triangular Sidebar Trigger Button

- **Branch**: `feat/UI`
- **Prompt**: User requested to make the sidebar trigger button slimmer.
- **Changes**:
  - Reduced the width of the triangular open trigger button in `SidebarOverlay.jsx` from `w-8` (32px) to an ultra-sleek `w-5` (20px).
  - Scaled down the internal `ChevronRight` icon size to `w-3.5 h-3.5` (14px) and set its left padding to `pl-0.5` (2px) to center it beautifully inside the slimmer triangle base without clipping.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout refinement only.

---

## [2026-05-27 16:17] — Re-theme Chatbox to Premium Black-and-White Palette

- **Branch**: `feat/UI`
- **Prompt**: User requested to change the chatbox primary color to black, make the main chat container/background white, color user messages green, and make AI responses black.
- **Changes**:
  - Re-themed both `ChatWidget.jsx` and `PlaceChatPanel.jsx` to share a unified premium black-and-white visual identity.
  - Made the header elements of the chatbox pitch black (`bg-ink-900`) with high-contrast white text, primary-300 subheadings, and white translucent hover buttons.
  - Set the main scrollable chat history area to pure white (`bg-white`).
  - Styled user message bubbles with the green brand color (`bg-primary-600 text-white`).
  - Re-styled the AI's response bubbles to be pitch black (`bg-ink-900 text-white border-ink-900`) with the Tailwind `prose-invert` utility for high-definition text rendering.
  - Configured markdown hyperlinks inside the dark AI bubbles to a light green color (`text-primary-400 font-semibold`) for legibility.
  - Changed the closed state of the floating chatbot button in `ChatWidget.jsx` to black (`bg-ink-900 hover:bg-ink-800 border-ink-900`).
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — theme and styling enhancement only.

---

## [2026-05-27 16:11] — Scale Down User Menu Button for Balanced Navbar Sizing

- **Branch**: `feat/UI`
- **Prompt**: User requested to adjust the personal page button size to be appropriate for the current navbar.
- **Changes**:
  - Reduced the personal page button height in `Navbar.jsx` to a sleek `h-10` (40px) and width to `w-10 sm:w-52` (matching `40px` on mobile and `208px` on desktop).
  - Scaled down the inner profile image and Google G icon fallback to `w-7 h-7` (28px).
  - Changed the username text font to `text-xs font-bold` to keep it compact and visually aligned inside the slimmed-down button.
  - This results in a perfect vertical gap of `12px` top/bottom inside the `64px` height navbar, looking extremely elegant, clean, and balanced.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout refinement only.

---

## [2026-05-27 15:56] — Custom Triangular Black Sidebar Trigger Button

- **Branch**: `feat/UI`
- **Prompt**: User requested to change the sidebar opening button to a triangle shape and colored black.
- **Changes**:
  - Imported `ChevronRight` in `SidebarOverlay.jsx` to replace the double chevrons for cleaner spacing.
  - Re-designed the sidebar open trigger button (visible when sidebar is closed) from a white rectangle to an elegant right-pointing black triangle (`bg-ink-900`, `style={{ clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}`).
  - Styled the button to light up in brand green (`hover:bg-primary-600`) when hovered, with a single sharp white `ChevronRight` icon centered at its base, creating an extremely premium, play-button-like visual affordance at the left viewport edge.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/SidebarOverlay.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual trigger control layout only.

---

## [2026-05-27 15:54] — Style Landing Page Navbar to Premium Dark Theme

- **Branch**: `feat/UI`
- **Prompt**: User requested to change the landing page navbar to black too.
- **Changes**:
  - Re-styled the `<header>` element in `LandingPage.jsx` to a premium semi-transparent dark black theme (`bg-ink-900/90`, `border-ink-900`, `shadow-soft`, `backdrop-blur-2xl`).
  - Unified the landing page logo with the updated app navbar: removed the square background box wrapper, rendered the favicon directly with hover scaling, and colored the logo title and subtitle to high-contrast `text-white` and `text-white/70`.
  - Re-themed the inline navigation links of the landing page navbar to float elegantly on the dark backdrop, using custom `text-slate-300 transition hover:bg-ink-800 hover:text-white` styling.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual theme consistency only.

---

## [2026-05-27 15:53] — Match Dropdown Width with Personal Page Button Sizing

- **Branch**: `feat/UI`
- **Prompt**: User requested to adjust the personal page button so that its dropdown popup is the same size/width as the button itself.
- **Changes**:
  - Configured the personal page button in `Navbar.jsx` with a fixed width of `w-52` (208px) on desktop screens (`sm:w-52`) and standard responsive sizing on mobile.
  - Set the dropdown popup container's width to `sm:w-full` so it stretches dynamically to perfectly match the `w-52` width of the parent button on desktop.
  - Enabled smooth text truncation on the username with `truncate flex-1 text-left` to ensure longer usernames are rendered elegantly without disrupting the fixed layout size.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout coordination only.

---

## [2026-05-27 15:52] — Integrate Google Icon / User Avatar in Personal Page Button

- **Branch**: `feat/UI`
- **Prompt**: User requested to make the icon inside the personal page button a Google icon.
- **Changes**:
  - Modified `Navbar.jsx` to render the user's Google profile avatar (`photoURL`) inside the white user menu trigger button, if available.
  - Implemented the official high-definition colorful Google "G" logo SVG as the fallback icon when no user profile picture is loaded.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual profile layout refinement only.

---

## [2026-05-27 15:50] — Refine Logo, Branding Subtitle, and User Menu Trigger Styling

- **Branch**: `feat/UI`
- **Prompt**: User requested to turn the branding subtitle text under "Smacco" to white, remove the square container around the logo icon, and change the user profile/personal page button to white.
- **Changes**:
  - Modified `Navbar.jsx` to render the Mapbox/Smacco favicon directly as a clean `w-8 h-8` image with a sleek `hover:scale-105` interaction, removing the square enclosing box.
  - Changed the branding subtitle "Tìm lưu trú bằng AI" text class from the dark primary tone to `text-white/70`, ensuring high visibility and premium contrast on the black navbar.
  - Redesigned the User Menu trigger button from a dark background to an elegant light/white background theme (`bg-white`, `border-base-200`, `text-slate-900`) with matching internal avatar styling (`bg-primary-50`, `text-primary-900`), adding sharp high-end contrast to the dark navbar.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual styling refinement only.

---

## [2026-05-27 15:48] — Center and Compact Search Bar to Eliminate Overlaps

- **Branch**: `feat/UI`
- **Prompt**: User requested to align the search bar position so that when search, sidebar, and chatbox are simultaneously open, none of them overlap each other.
- **Changes**:
  - Re-positioned the search bar container in `Navbar.jsx` to be centered horizontally using the Tailwind class `mx-auto` (replacing `md:ml-auto lg:ml-auto` which pushed it to the right).
  - Compacted the search bar container's max width using `max-w-md xl:max-w-lg` (448px - 512px).
  - This guarantees that on standard desktop screens (>=1280px), the search input and its advanced filter dropdown will occupy the central gap of the screen, completely avoiding overlaps with the left-aligned `SidebarOverlay` (width ~384px) and right-aligned chat widgets (width ~384px).
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual responsive centering layout only.

---

## [2026-05-27 15:46] — Remove Map Controls and Mapbox Logos/Attribution

- **Branch**: `feat/UI`
- **Prompt**: User requested to completely remove the map navigation controls (+ and - zoom buttons) and any bottom elements like the Mapbox logo/attribution.
- **Changes**:
  - Removed standard `mapboxgl.NavigationControl` and `mapboxgl.AttributionControl` creation inside `MapComponent.jsx` so that no zoom buttons or default attribution widget is added to the map element.
  - Added CSS overrides in `index.css` targeting `.mapboxgl-ctrl-logo` and `.mapboxgl-ctrl-attrib` with `display: none !important` to cleanly hide all Mapbox watermark logos, links, and text containers.
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/MapComponent.jsx`
  - `frontend/src/index.css`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual mapping layout optimization only.

---

## [2026-05-27 15:43] — Restore Standard Font Sizing and Element Scale

- **Branch**: `feat/UI`
- **Prompt**: User requested to make ONLY the Smacco logo icon box and navbar height smaller, reverting the accidental shrinkages of other texts, categories, and elements.
- **Changes**:
  - Restored the brand "Smacco" logo text size in `Navbar.jsx` from `text-base` back to its original `text-lg` size.
  - Standardized the Smacco logo image class size from the invalid `w-5.5` to a proper standard Tailwind size `w-6 h-6`.
  - Restored font sizes in `PlaceChatPanel.jsx` (place name from `text-sm font-black` back to `text-base font-bold`, category label from `text-[11px]` to `text-sm font-semibold`, and welcome helper text to `text-sm`).
  - Verified that all components compile and build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — bugfix and sizing restoration only.

---

## [2026-05-27 15:32] — Scale Down Navbar Elements for Sleek Alignment

- **Branch**: `feat/UI`
- **Prompt**: User requested to make the icons/elements smaller to prevent the navbar from bulging.
- **Changes**:
  - Scaled down the logo box size from `w-11 h-11` (44px) to `w-9 h-9` (36px), and its inner logo icon from `w-7` to `w-5.5` (22px).
  - Shrank the search input bar height from `h-12` (48px) to a super compact `h-10` (40px) and adjusted padding, input text size, and the search icon (`w-4` = 16px).
  - Reduced the Advanced Filters toggle trigger button padding (`p-1`) and icon size (`w-3.5`).
  - Scaled down the right-side User Profile trigger button vertical padding (`py-1.5`) and user circular letter avatar size from `w-9` (36px) to a sleek `w-7` (28px) with `text-xs font-black` initials.
  - Verified that all components build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout optimization only.

---

## [2026-05-27 15:30] — Revert Popover Dropdown Menus to Light Theme

- **Branch**: `feat/UI`
- **Prompt**: User clarified that only the navbar itself should be black, and all dropdown popovers (filters and profile) should remain white/light.
- **Changes**:
  - Reverted the Advanced Filters dropdown and the Account User dropdown in `Navbar.jsx` to their original elegant light-themed (`map-surface`, `bg-white`, `border-base-200`) layouts.
  - Retained the high-end dark styling on the main horizontal navbar strip and user menu trigger button.
  - Verified that all components build successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — theme adjustment only.

---

## [2026-05-27 15:28] — Redesign Navbar to Dark Black Theme

- **Branch**: `feat/UI`
- **Prompt**: User requested to change the Navbar to black completely.
- **Changes**:
  - Rebuilt the entire `Navbar.jsx` to use a premium, pitch-black color palette (`bg-ink-900` with `border-ink-900`).
  - Styled all interior branding elements (Logo text to `text-white`, subtitle to `text-primary-400`).
  - Created a gorgeous dark-themed search input field (`bg-ink-950/80`, `border-ink-700`, `text-white` with a `text-ink-500` search icon).
  - Replaced the light Advanced Filters dropdown menu with a complete dark mode popover (`bg-ink-900`, `border-ink-700`, dark location inputs, dark category selectors, and dark budget slider layouts).
  - Redesigned the right-side User Profile trigger button (`bg-ink-950/70`, `border-ink-750`) and its interior circular letter avatar (`bg-primary-900`, `text-primary-200`, `border-primary-800`), as well as the account popover list options to match the black theme.
  - Verified that all components compile successfully.
- **Modified files**:
  - `frontend/src/components/Navbar.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — theme and styling enhancement only.

---

## [2026-05-27 15:23] — Optimize Map Page Layout and Apply Unified Brand Theme

- **Branch**: `feat/UI`
- **Prompt**: User requested to unify the green theme colors on the map page and resolve the overlapping issues when search filters, chatbox, and sidebar are simultaneously open.
- **Changes**:
  - Relocated the place-specific `PlaceChatPanel` below the 80px Navbar (`top-24 sm:top-[90px] bottom-3 sm:bottom-4`) and styled it with premium rounded corners, base panel surfaces, and shadow cards.
  - Implemented custom event-driven responsive alignment in `ChatWidget` and `PlaceChatPanel`. When `PlaceChatPanel` is open, `ChatWidget` shifts dynamically to `right-[416px]` on desktop to align side-by-side, and hides completely on mobile to eliminate overlap.
  - Cleansed `ChatWidget.jsx` and `PlaceChatPanel.jsx` of all non-brand colors (cyan, blue, indigo), converting them fully to `primary` (green) and `accent` (orange) Tailwind classes.
  - Verified the changes build successfully.
- **Modified files**:
  - `frontend/src/components/ChatWidget.jsx`
  - `frontend/src/components/PlaceChatPanel.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — layout optimization and theme unification only.

---

## [2026-05-27 15:18] — Elevate Landing Page Logged-In User Interface

- **Branch**: `feat/UI`
- **Prompt**: User requested to make the "already signed in" section at the bottom of the landing page look more premium and less simple.
- **Changes**:
  - Replaced the simple textual logged-in block with a modern user card dashboard layout.
  - Implemented smart avatar detection (using Google photoURL if present, falling back to a stylish gradient avatar with the user's initial).
  - Added a "Thành viên Smacco" member status badge with warm accents and a Sparkles icon.
  - Added mock integration indicators for the interactive map workspace ("Bản đồ tương tác - Sẵn sàng") and the AI chat assistant ("Trợ lý tìm kiếm - Trực tuyến").
  - Bound the `logout` function from `AuthContext` to a sleek secondary "Đăng xuất" button to allow users to sign out directly from the landing page.
  - Verified that the application compiles cleanly.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — visual enhancement and direct logout button linkage.

---

## [2026-05-27 15:15] — Translate Landing Page to Vietnamese

- **Branch**: `feat/UI`
- **Prompt**: User requested to translate the landing page to professional, natural Vietnamese, avoiding generic AI-sounding words.
- **Changes**:
  - Translated all labels, proof items, benefits, workflows, testimonials, faqs, mock places, login fields, error messages, and descriptions in `LandingPage.jsx` into professional, high-end Vietnamese.
  - Avoided typical mechanical machine-translation and AI-sounding terms, ensuring human-like copywriting suited for a premium SaaS product.
  - Verified the changes compile successfully by running a complete production build.
- **Modified files**:
  - `frontend/src/pages/LandingPage.jsx`
  - `.ppms/architecture-feat-UI.md`
  - `.ppms/log-feat-UI.md`
- **Created files**: —
- **Deleted files**: —
- **Architecture impact**: No — localization and copywriting update only.

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
