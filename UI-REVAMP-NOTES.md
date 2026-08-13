# UofA Reading HUB — UI/UX Revamp

## What's new

### Design system
- Rich CSS variables for **dark** (default/admin) and **light** (student) themes
- Gradients on logos, buttons, KPI highlights
- Soft shadows, elevated cards with hover lift
- Consistent border radius (0.75–1rem)
- Custom scrollbar & selection styles

### Animations (subtle)
- Fade-in / fade-in-up on cards & pages
- Scale-in on login
- Slide-in on sidebars
- Stagger children for KPI grids
- Hover shine on KPI cards
- Smooth transitions on theme switch

### Icons & navigation
- Lucide icons with active state pill + left accent bar
- Icon chips that fill with accent when active
- Sparkles badge on logo
- Gradient logo mark

### Student theme toggle
- **Settings** page (`/dashboard/settings`) with Light / Dark cards
- Quick toggle button in the student topbar (sun/moon)
- Preference saved to `localStorage` (`uofa-theme`)
- ThemeProvider wraps the whole app

### Components updated
- `index.css` — full theme + utilities
- `ThemeContext.jsx` — new
- `Sidebar.jsx` / `UserSidebar.jsx` — polished nav
- `Topbar.jsx` / `UserTopbar.jsx` — glass, search focus rings, theme button
- `KpiCard.jsx` — gradient highlight, icons, shine
- `Login.jsx` — ambient gradients, better form
- `UserLayout.jsx` / `AdminLayout.jsx` — consistent shells
- `StudentSettings.jsx` — new page
- `App.jsx` — ThemeProvider + settings route

## How to use
1. Unzip into your project folder (or replace `src/` + keep your extra files like geminiGenerate etc.)
2. `npm install` (if needed)
3. `npm run dev`
4. As a student, open **Settings** or click the sun/moon icon in the topbar

Admin stays dark by design. Students can switch freely (market as paid feature if you want).

## Notes
- Your local files that are not in the public GitHub repo (e.g. AiGenerate*, geminiGenerate.js) were **not** overwritten — only the files present in the cloned repo were enhanced.
- Paste this `src` over yours carefully, or merge the theme/context pieces if you have a more advanced local branch.
