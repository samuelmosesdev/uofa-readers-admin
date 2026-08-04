# UofA Readers — Admin Dashboard (Page 1)

This is the first live page of UofA Readers: the **Admin Dashboard**, built to match
your design (dark navy + mint theme, KPI cards, growth chart, free-vs-paid donut,
recent activity table with quick actions).

It is fully wired to **Firebase Firestore** with real-time listeners
(`onSnapshot`) — nothing on this page is hard-coded or mock data. Add a document
to Firestore and the dashboard updates instantly.

---

## 1. VS Code setup

1. Install **VS Code**: https://code.visualstudio.com
2. Install **Node.js 18+** (LTS): https://nodejs.org — check with `node -v`
3. Recommended VS Code extensions:
   - **ES7+ React/Redux/React-Native snippets**
   - **Tailwind CSS IntelliSense**
   - **Firebase** (by Firebase / toba) — optional, for `.rules` syntax highlighting
   - **Prettier — Code formatter**
   - **ESLint**
4. Open this folder in VS Code: `File > Open Folder... > uofa-readers-admin`
5. Open the integrated terminal (Ctrl/Cmd + `) and run:
   ```bash
   npm install
   npm run dev
   ```
   Vite will print a local URL (usually `http://localhost:5173`) — open it in your browser.

---

## 2. Firebase setup

### a) Create the project
1. Go to https://console.firebase.google.com → **Add project** → name it `uofa-readers` (or similar).
2. Once created, click the **Web** icon (`</>`) to register a web app — this gives you the config values.

### b) Enable the products this app uses
In the left sidebar:
- **Authentication** → Get started → enable **Email/Password** and **Google** sign-in methods.
- **Firestore Database** → Create database → start in **production mode** → pick your region.
- **Storage** → Get started (used later for profile pictures / document uploads).

### c) Copy your config into `.env.local`
```bash
cp .env.example .env.local
```
Fill in the values from **Project settings → General → Your apps → SDK setup and configuration**:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
`.env.local` is already git-ignored — never commit real Firebase keys to a public repo
(the API key itself is not secret, but keeping it out of version control is still good
practice; the real protection is your **Firestore security rules**, included in
`firestore.rules`).

### d) Deploy security rules
Install the Firebase CLI once, globally:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # point it at this project, keep the existing firestore.rules file
firebase deploy --only firestore:rules
```

### e) Seed a little data so the dashboard has something to show
In the Firestore console, create these collections and a document or two in each
(field names must match exactly — see comments in `src/hooks/useDashboardData.js`):

| Collection      | Example fields |
|------------------|----------------|
| `users`          | `name: "Ada Lovelace"`, `email: "ada@uofa.edu"`, `role: "student"`, `plan: "annual"`, `createdAt: (timestamp, click the clock icon)` |
| `agents`         | `name: "Grace Hopper"`, `email: "grace@uofa.edu"`, `status: "active"`, `createdAt: (timestamp)` |
| `documents`      | `title: "Intro to Statistics.pdf"`, `uploadedBy: agentId`, `createdAt: (timestamp)` |
| `subscriptions`  | `userId: userId`, `status: "active"`, `plan: "annual"`, `startedAt: (timestamp)` |
| `activityLog`    | `userName: "Ada Lovelace"`, `action: "New document uploaded"`, `status: "success"`, `reference: "#0A2540"`, `createdAt: (timestamp)` |

Once these exist, refresh the app — KPIs, the growth chart, the donut, and the
activity table populate live from Firestore.

Using the **"Add User"** / **"Add Agent"** buttons on the dashboard also writes
directly to Firestore (`src/components/QuickAddForm.jsx`), so you can test the
real-time behavior without touching the console at all.

---

## 3. Project structure

```
src/
  firebase/config.js         Firebase app + Auth + Firestore + Storage init
  context/AuthContext.jsx    Live-tracks the signed-in user & their Firestore profile
  hooks/
    useDashboardData.js       Admin: onSnapshot -> KPIs, growth, free/paid split, activity
    useNotifications.js       Admin: live unread notification count
    useUserDashboardData.js   Student: onSnapshot -> KPIs, "continue" progress, recommended courses
  components/
    Sidebar.jsx, Topbar.jsx                     Admin shell
    UserSidebar.jsx, UserTopbar.jsx              Student shell
    KpiCard.jsx, GrowthChart.jsx, FreeVsPaidDonut.jsx, RecentActivityTable.jsx  (admin)
    StudentKpiCard.jsx, ContinueCard.jsx, RecommendedCard.jsx, UniqueIdBadge.jsx (student)
    Modal.jsx, QuickAddForm.jsx
  pages/
    AdminDashboard.jsx        /admin
    UserDashboard.jsx         /dashboard
  App.jsx                     Routes between the two + a temporary "Admin view / Student
                               view" switcher bottom-right for previewing both without auth
```

Open `http://localhost:5173/admin` for the Admin Dashboard and
`http://localhost:5173/dashboard` for the Student Dashboard, or use the small
switcher pinned to the bottom-right corner while you're previewing.

> The switcher and the `/` → `/dashboard` redirect are placeholders. Once
> Login/Signup ships, replace them with real protected routes that redirect
> based on the signed-in user's `role` field (`admin`, `agent`, `student`).

## 4. Student Dashboard data model

In addition to the admin collections, the Student Dashboard reads:

| Collection      | Example fields |
|------------------|----------------|
| `users/{uid}`    | adds `uniqueId: "UAR-24-8831"`, `coursesEnrolledCount: 4`, `questionsPracticedCount: 128`, `studyStreakDays: 12` |
| `enrollments`    | `userId`, `courseTitle: "Calculus II"`, `topicLabel: "Limits & Continuity"`, `progressPct: 65`, `lastAccessedAt: (timestamp)` |
| `courses`        | `title: "Statistics Fundamentals"`, `code: "#0AB408"`, `thumbnailUrl`, `category` -- powers "Recommended for you" |
| `notifications`  | add `userId` field alongside the existing `readByAdmin` so per-student unread counts work |

`uniqueId` is meant to be generated once at signup (e.g. `UAR-` + year + a
short random/sequential suffix) and written to the user's profile document --
the barcode-style badge in the top bar renders directly from that real value.

## 5. Next pages

This ships the **Admin Dashboard** and **Student Dashboard**. The same pattern
(Firestore collection → `onSnapshot` hook → component) extends cleanly to the
remaining screens: Login/Signup, Reading Hub, CBT/Practice, Profile & Settings,
and the Agent dashboard. Say the word and I'll build the next one the same way.
