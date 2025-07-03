# 📦 Modular App Structure (Greta Optimized)

This project has been split into four main parts to stay within Greta’s 50-file limit and for easier maintainability.

---

## 🧱 Folders Overview

### 1. `__PART1_CORE/` – Core App Bootstrapping
Contains everything needed to start and mount the application.

- `App.jsx` – Main app component wrapper
- `index.jsx` – ReactDOM render & router
- `index.html` – Main HTML shell
- `App.css`, `index.css` – Global styles
- `.env.example` – Environment variable sample
- `vite.config.js` – Vite build setup

---

### 2. `__PART2_PAGES/` – Application Screens
Contains screen-level UI files shown as full pages.

Examples:
- `Login.jsx`
- `Dashboard.jsx`
- `LessonMaker.jsx`
- `UserManagement.jsx`
- `WordSearchGenerator.jsx`
- `AILessonHome.jsx`, `AISettings.jsx`

---

### 3. `__PART3_COMPONENTS/` – Reusable UI Components
Contains all presentational and shared components used across multiple pages.

Examples:
- `Layout.jsx`
- `Navbar.jsx`
- `Sidebar.jsx`
- `SafeIcon.jsx`

---

### 4. `__PART4_LOGIC/` – Application Logic, Services, and Context
Handles backend calls, auth, reusable logic, and utility functions.

Examples:
- `AuthContext.jsx` – Global auth context
- `ProtectedRoute.jsx` – Route guard logic
- `pdfService.js`, `aiservice.js`, `supabase.js`
- `checkLessons.js`, `passwordGenerator.js`, `wordSearch.js`

---

## 🛠 Reassembling the App (If Needed)

To rebuild the original structure:
1. Create a `src/` folder
2. Move contents from all four parts back into `src/`:
   - Core: `App.jsx`, `index.jsx`, config
   - Pages: into `src/pages/` or wherever they originally were
   - Components: into `src/components/`
   - Logic: into `src/utils/`, `src/lib/`, or `src/contexts/`

---

## 👩‍💻 Recommended Workflow

- Load only **one part at a time** into Greta
- Keep other parts stored in GitHub
- Recombine only when needed for build or testing

---

✅ Modular, scalable, Greta-friendly 🚀

Add main README.md with modular folder structure
