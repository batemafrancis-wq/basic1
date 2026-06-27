# EgoSMS Pro Dashboard — Project Documentation

**Platform:** EgoSMS by Pahappa Limited (Uganda)
**Stack:** React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS v4 · Zustand · Framer Motion · Recharts
**Build output:** Single self-contained HTML file (`vite-plugin-singlefile`)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Running & Building](#2-running--building)
3. [Architecture Overview](#3-architecture-overview)
4. [Global State — The Store](#4-global-state--the-store)
5. [Pages Reference](#5-pages-reference)
6. [Components Reference](#6-components-reference)
7. [AI Systems](#7-ai-systems)
8. [Data Flow & Live Updates](#8-data-flow--live-updates)
9. [Styling Conventions](#9-styling-conventions)
10. [Remaining Tasks (12%)](#10-remaining-tasks-12)
11. [How to Implement Each Remaining Task](#11-how-to-implement-each-remaining-task)

---

## 1. Project Structure

```
basic/
├── src/
│   ├── App.tsx                    # Root: router + global overlay mounts
│   ├── main.tsx                   # ReactDOM entry point
│   ├── index.css                  # Tailwind base styles
│   │
│   ├── store/
│   │   └── dashboardStore.ts      # ★ SINGLE SOURCE OF TRUTH (Zustand)
│   │
│   ├── data/
│   │   └── mockData.ts            # Seed data (used only to initialise store)
│   │
│   ├── pages/
│   │   ├── DashboardPage.tsx      # Live KPIs, charts, campaigns table
│   │   ├── SendSMSPage.tsx        # ⚠️ NOT fully wired to store yet
│   │   ├── ContactsPage.tsx       # Full CRUD via store
│   │   ├── CampaignsPage.tsx      # Full CRUD via store
│   │   ├── AnalyticsPage.tsx      # ⚠️ KPIs still hardcoded
│   │   ├── ReportsPage.tsx        # Live campaigns + store chartData
│   │   ├── BillingPage.tsx        # Live balance / topup via store
│   │   ├── APIPage.tsx            # API docs, key management, webhooks
│   │   ├── SettingsPage.tsx       # Profile, sender IDs, notifications, security
│   │   └── GenericPage.tsx        # Fallback placeholder (unused in router)
│   │
│   ├── components/
│   │   ├── Sidebar.tsx            # Collapsible nav, live bell count
│   │   ├── TopBar.tsx             # Period selector, live bell count
│   │   ├── AIChatbot.tsx          # ★ Autonomous AI — 20+ actions
│   │   ├── AINotificationEngine.tsx # ★ Background AI rule engine
│   │   ├── NotificationPanel.tsx  # Slide-in bell drawer
│   │   ├── TutorialOverlay.tsx    # Interactive tour with DOM click sim
│   │   ├── ToastNotifications.tsx # Progress-bar toasts with actions
│   │   ├── RatingModal.tsx        # 5-star rating (triggered by store)
│   │   ├── FeedbackWidget.tsx     # Left-edge feedback slide-out
│   │   ├── AnomalyBanner.tsx      # ⚠️ Static banner — not wired to store
│   │   ├── AIInsightsPanel.tsx    # Dashboard right-panel AI insights
│   │   ├── Charts.tsx             # All 4 charts — reads store.chartData
│   │   ├── KPICard.tsx            # Animated metric card with sparkline
│   │   └── TutorialOverlay.tsx    # DOM-click tour with cursor animation
│   │
│   └── utils/
│       └── cn.ts                  # Tailwind class merging utility
│
├── public/
│   └── images/egosms-logo.png
├── package.json
├── tsconfig.json
├── vite.config.ts
└── DOCUMENTATION.md               # This file
```

---

## 2. Running & Building

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
# → opens http://localhost:5173

# Build single-file HTML for production
npm run build
# → outputs dist/index.html  (fully self-contained)

# Preview the production build
npm run preview
```

**TypeScript strict flags in tsconfig.json:**
- `noUnusedLocals: true` — any unused variable is a compile error
- `noUnusedParameters: true` — unused function params are errors
- Always run `npm run build` and fix all errors before delivering the file.

---

## 3. Architecture Overview

```
User Interaction
      │
      ▼
┌─────────────┐      reads/writes      ┌──────────────────────┐
│  React Pages│ ◄──────────────────── │   dashboardStore.ts  │
│  + Components│ ──────────────────── │   (Zustand)          │
└─────────────┘                        └──────────┬───────────┘
                                                   │ subscribes
                                        ┌──────────▼───────────┐
                                        │ AINotificationEngine │
                                        │ (background rules)   │
                                        └──────────────────────┘
```

**Key principle:** Every page reads from and writes to `dashboardStore`.
No page should import from `mockData.ts` for display data —
`mockData.ts` is only used inside `dashboardStore.ts` as seed values.

**Navigation:** There is no React Router. Navigation is a single
`activePage` string in the store. `App.tsx` renders the matching page
via a `switch` statement.

---

## 4. Global State — The Store

**File:** `src/store/dashboardStore.ts`

### State Fields

| Field | Type | Description |
|-------|------|-------------|
| `activePage` | `ActivePage` | Current page string — drives navigation |
| `timePeriod` | `'mtd' \| 'ytd' \| 'rolling90'` | Period selector for charts/KPIs |
| `chartData` | `typeof mtdData` | Active chart data slice — auto-updated by `setTimePeriod` |
| `isDarkMode` | `boolean` | Theme toggle |
| `sidebarCollapsed` | `boolean` | Sidebar width state |
| `isChatOpen` | `boolean` | EgoBot chatbot open/closed |
| `isTutorialActive` | `boolean` | Tutorial overlay visibility |
| `tutorialStep` | `number` | Which tutorial step (0–7) |
| `balanceUGX` | `number` | Live UGX credit balance (starts 245,000) |
| `smsCredits` | `number` | Live SMS credits (starts 4,900) |
| `contacts` | `Contact[]` | Live contact list |
| `campaigns` | `Campaign[]` | Live campaign list |
| `transactions` | `Transaction[]` | Live billing transaction log |
| `smsStats` | `SmsStats` | `{ sent, delivered, failed, deliveryRate }` |
| `notifications` | `Notification[]` | Toast notification queue |
| `appNotifications` | `AppNotification[]` | Bell-panel AI notifications |
| `isNotificationPanelOpen` | `boolean` | Bell drawer open/closed |
| `pendingRating` | `object \| null` | Triggers `RatingModal` when set |

### Key Actions

```typescript
// Balance
store.addCredits(ugx: number, credits: number)    // topup
store.deductCredits(credits: number)               // send SMS cost

// Contacts
store.addContact(c: Omit<Contact, 'id'>)
store.deleteContact(id: number)
store.updateContact(id: number, patch: Partial<Contact>)

// Campaigns
store.addCampaign(c: Omit<Campaign, 'id'>)
store.updateCampaign(id: number, patch: Partial<Campaign>)

// Transactions (billing history)
store.addTransaction(t: Omit<Transaction, 'id'>)

// SMS Stats
store.updateSmsStats(patch: Partial<SmsStats>)

// Toasts
store.addNotification({ type, title, message, action? })
store.removeNotification(id)

// Bell notifications
store.addAppNotification({ type, category, title, summary, cause, prediction, solution })
store.markAppNotificationRead(id)
store.markAllAppNotificationsRead()
store.dismissAppNotification(id)
store.clearAllAppNotifications()
store.setNotificationPanelOpen(open: boolean)

// Rating modal
store.requestRating(label: string, onRate: (stars, comment) => void)
store.clearRating()

// UI
store.setActivePage(page: ActivePage)
store.setTimePeriod(period: TimePeriod)   // also updates chartData
store.toggleDarkMode()
store.setSidebarCollapsed(collapsed)
store.setChatOpen(open)
store.setTutorialActive(active)
store.setTutorialStep(step)
```

---

## 5. Pages Reference

### DashboardPage `src/pages/DashboardPage.tsx`
- **Live data:** Reads `smsStats`, `contacts.length`, `campaigns.length`, `balanceUGX`, `smsCredits` from store
- **KPI cards:** Built dynamically — changing `timePeriod` changes the values
- **Charts:** `<SMSVolumeChart />`, `<DeliveryRateChart />`, `<NetworkPieChart />`, `<CostTrendChart />` — all from `Charts.tsx`
- **Campaigns table:** Reads `store.campaigns` directly

### SendSMSPage `src/pages/SendSMSPage.tsx` ⚠️
- **Current state:** Only calls `addNotification` on send — does NOT update store
- **Needs:** `deductCredits`, `updateSmsStats`, `addCampaign`, `addTransaction` calls on send
- See Section 11 Task 1 for exact implementation

### ContactsPage `src/pages/ContactsPage.tsx` ✅
- Reads `store.contacts`, calls `addContact`, `deleteContact`
- CSV import adds 3 dummy contacts + triggers `requestRating`
- Add Contact modal triggers `requestRating` after save

### CampaignsPage `src/pages/CampaignsPage.tsx` ✅
- Reads `store.campaigns`, calls `addCampaign`, `updateCampaign`
- Live stats: total / running / scheduled / avgRate computed from store
- New Campaign modal: name, sender, message, schedule date/time
- Pause / Resume / Archive all call `updateCampaign`

### BillingPage `src/pages/BillingPage.tsx` ✅
- Reads `store.balanceUGX`, `store.smsCredits`, `store.transactions`
- Top-Up modal calls `addCredits` + `addTransaction` — balance updates instantly
- `CountUp` re-animates on every balance change
- Auto-recharge UI (saves to local state only — not yet persisted to store)

### AnalyticsPage `src/pages/AnalyticsPage.tsx` ⚠️
- Uses same `<Charts />` components (those are live)
- KPI metrics (`deliveryRate`, `peakHour`, `optOutRate`) are hardcoded strings
- Anomaly log is static array
- See Section 11 Task 3 for fix

### ReportsPage `src/pages/ReportsPage.tsx` ✅
- Live: reads `store.campaigns`, `store.smsStats`, `store.chartData`
- Summary KPI cards computed from live store values
- Download modal simulates export + fires success toast

### APIPage `src/pages/APIPage.tsx` ✅
- 4 tabs: Overview (code samples), API Keys (reveal/copy/revoke/create), Webhooks, Docs
- All state is local — no store integration needed (API keys are mock)

### SettingsPage `src/pages/SettingsPage.tsx` ⚠️
- 4 tabs: Profile, Sender IDs, Notifications, Security
- Profile form and password form fire toasts but do NOT write to store
- See Section 11 Task 5 for fix

---

## 6. Components Reference

### Sidebar `src/components/Sidebar.tsx`
- Reads `appNotifications` from store, computes `unread` count
- Bell button calls `setNotificationPanelOpen(!isNotificationPanelOpen)`
- Nav buttons have `data-tutorial={nav-${item.page}}` for tutorial targeting
- AI Copilot banner has `data-tutorial="ai-copilot-banner"`

### TopBar `src/components/TopBar.tsx`
- Period selector has `data-tutorial="period-selector"`
- Bell button reads `unread` from store, opens/closes notification panel
- Period buttons call `setTimePeriod` which also updates `chartData`

### AIChatbot `src/components/AIChatbot.tsx` ★
Full autonomous AI. Security tiers:

| Tier | Examples | Behaviour |
|------|----------|-----------|
| `safe` | add contact, create campaign, navigate, dark mode | Executes instantly |
| `sensitive` | send SMS, topup, delete contact, pause campaign | Shows **Confirm / Reject** card |
| `dangerous` | delete all contacts/campaigns, clear history | Shows **Password Gate** (`admin123`) |
| `blocked` | drop database, hack, bypass security | Refuses + shows support card |

**Support card contacts:**
- Phone/Call: `+25678564017`
- WhatsApp: `https://wa.me/25678564017`
- Email: `support@pahappa.com`

**Adding new intents:** Edit the `parseIntent()` function (top of file).
Return `{ intent: 'your-intent', security: 'safe'|'sensitive'|'dangerous'|'blocked', slots: {} }`.
Then handle `case 'your-intent':` inside `handleSend()`.

### AINotificationEngine `src/components/AINotificationEngine.tsx` ★
Invisible component mounted in `App.tsx`. Runs:
- Once on mount (seeds 4 initial notifications after 1.2s)
- Every 30 seconds (interval rule evaluation)
- On change of `smsCredits`, `deliveryRate`, or `campaigns.length`

**Adding a new rule:** Add a `canFire('your-key')` check + `add({...})` call
inside any of the `check*` functions. The `COOLDOWN` object at the top
controls minimum minutes between repeat fires.

### NotificationPanel `src/components/NotificationPanel.tsx` ★
- Reads `store.appNotifications`
- Filter tabs: All / Critical / Warnings / Predictions / Info
- Each card is expandable showing **Cause → AI Prediction → Recommended Action**
- Clicking action button navigates to `actionPage` via `setActivePage`

### TutorialOverlay `src/components/TutorialOverlay.tsx` ★
- 8 steps defined in the `STEPS` array at top of file
- Each step has: `selector` (data-tutorial value), `page` (navigate before spotlight), `simulateClick` (fire `.click()`), `autoAdvance` (ms)
- Cursor travels from bottom-right to centre of target element
- Press animation: cursor shrinks + 3 ripple rings expand

**Adding a new step:** Add to the `STEPS` array. Add `data-tutorial="your-key"` to the target DOM element.

### ToastNotifications `src/components/ToastNotifications.tsx`
- Reads `store.notifications` queue
- 5-second countdown progress bar (pauses on hover)
- Optional `action: { label, onClick }` renders a button inside the toast
- Stacks up to 4, spring-physics entrance/exit

### RatingModal `src/components/RatingModal.tsx`
- Triggered by `store.requestRating(label, callback)`
- 5 stars with hover labels (Terrible / Poor / OK / Good / Excellent)
- Optional comment textarea
- On submit calls `callback(stars, comment)` then `store.clearRating()`

### FeedbackWidget `src/components/FeedbackWidget.tsx`
- Always-visible tab on left edge
- Slide-out panel: mood picker (Happy/Neutral/Unhappy), category dropdown,
  message textarea (500 char), optional email
- Submit fires success toast + success animation

### Charts `src/components/Charts.tsx` ✅
All 4 charts now read `store.chartData` (not static mockData).
`setTimePeriod` in the store swaps `chartData` to the matching slice.

| Export | Chart type | Data key |
|--------|-----------|----------|
| `SMSVolumeChart` | Grouped bar | sent / delivered / failed |
| `DeliveryRateChart` | Line | rate |
| `NetworkPieChart` | Pie | networkBreakdown (still static — acceptable) |
| `CostTrendChart` | Bar | cost |

---

## 7. AI Systems

The project has three distinct AI systems. All are rule-based (no external API).

### 7.1 EgoBot Chatbot (`AIChatbot.tsx`)

**How the intent parser works:**
1. User types a message → `parseIntent(raw)` runs regex patterns top-to-bottom
2. Returns `{ intent, security, slots }` — slots are extracted values (name, phone, ugx, etc.)
3. `handleSend()` receives the parsed intent:
   - `safe` → executes immediately via `executeApproved()`
   - `sensitive` → pushes a message with `card: 'confirm'` and stores intent in `pendingRef`
   - `dangerous` → pushes a message with `card: 'password-gate'`
   - `blocked` → pushes a message with `card: 'escalated'`
4. When user confirms/enters password → `handleConfirm`/`handleUnlock` → calls `executeApproved()`

**`executeApproved` handles:** topup, send-sms, send-bulk-sms, delete-contact,
pause-campaign, change-sender, delete-all-contacts, delete-all-campaigns, delete-all-transactions

**Demo password for dangerous operations:** `admin123`

### 7.2 AI Notification Engine (`AINotificationEngine.tsx`)

Rule functions and their triggers:

| Function | Condition | Notification type |
|----------|-----------|------------------|
| `checkBalance` | credits < 1000 | warning |
| `checkBalance` | credits < 200 | critical |
| `checkBalance` | credits === 0 | critical |
| `checkDelivery` | rate < 92% | warning |
| `checkDelivery` | rate < 85% | critical |
| `checkDelivery` | failure rate > 10% | warning |
| `checkCampaigns` | running campaign rate < 80% | warning |
| `checkCampaigns` | 0 campaigns | info |
| `checkContacts` | < 10 contacts | info |
| `checkBurnRate` | credits will run out in ≤ 3 days | prediction |

Each notification has: `title`, `summary`, `cause`, `prediction`, `solution`, optional `actionPage`.

### 7.3 AI Insights Panel (`AIInsightsPanel.tsx`)

Simple static insights panel shown on the Dashboard right column.
Currently reads from `mockData.ts/aiInsights`. To make it live:
replace the import with computed values from `store.smsStats` and `store.campaigns`.

---

## 8. Data Flow & Live Updates

When a user does something that should update data:

```
User Action
    │
    ▼
Page/Component calls store action
    │
    ▼
Zustand updates state (immutable — creates new object)
    │
    ├──► All subscribed components re-render with new values
    │
    ├──► AINotificationEngine useEffect fires (if credits/rate/campaigns changed)
    │         └──► May add new AppNotification to store
    │
    └──► TopBar + Sidebar re-render with new unread count
```

**Example — Top Up flow:**
```
BillingPage → handleTopup()
  → store.addCredits(ugx, credits)       ← balanceUGX + smsCredits update
  → store.addTransaction({...})          ← transactions array prepends new row
  → store.addNotification({...})         ← toast fires
  → CountUp in balance card re-animates  ← because key={balanceUGX} changes
  → AINotificationEngine re-evaluates    ← may dismiss low-balance alert
```

**Example — Send SMS flow (currently incomplete — see Task 1):**
```
SendSMSPage → handleSend()
  → store.deductCredits(count)           ← balance drops
  → store.updateSmsStats({sent, delivered}) ← delivery stats update
  → store.addCampaign({...})             ← appears in Campaigns page
  → store.addTransaction({type:'usage'}) ← appears in Billing history
  → store.addNotification({...})         ← toast fires
```

---

## 9. Styling Conventions

All styling uses **Tailwind CSS v4** utility classes.

### Reusable class string patterns (copy these in every page/component)

```typescript
// Card container
const card = `rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1E293B] border-slate-700/60' : 'bg-white border-slate-200/60'} shadow-sm`;

// Muted secondary text
const muted = `text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;

// Form label
const labelCls = `text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;

// Text input / select
const inputCls = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
  isDarkMode
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
}`;
```

### Brand colours (use these everywhere, never invent new ones)

| Colour | Hex | Usage |
|--------|-----|-------|
| Blue | `#2563EB` | Primary actions, links |
| Green | `#10B981` | Success, delivery, confirmations |
| Gradient | `from-[#2563EB] to-[#10B981]` | Buttons, active states, badges |
| Dark bg | `#0F172A` | Dark mode page background |
| Dark card | `#1E293B` | Dark mode card background |

### Motion conventions
- Page entrance: `initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}`
- List item stagger: `transition={{ delay: i * 0.08 }}`
- Hover lift: `whileHover={{ y: -2 }}` or `whileHover={{ scale: 1.02 }}`
- Modal: `initial={{ scale:0.92, y:20 }} animate={{ scale:1, y:0 }}`
- Spring toggles: `type:'spring', stiffness:500, damping:30`

---

## 10. Remaining Tasks (12%)

| # | File | Task | Priority |
|---|------|------|----------|
| 1 | `SendSMSPage.tsx` | Wire send button to live store | HIGH |
| 2 | `Sidebar.tsx` | Fix bell button onClick handler | HIGH |
| 3 | `AnalyticsPage.tsx` | Replace hardcoded KPIs with live store values | MEDIUM |
| 4 | `AnomalyBanner.tsx` | Replace static text with live store notifications | MEDIUM |
| 5 | `SettingsPage.tsx` | Wire password/profile to store + match demo password | LOW |
| 6 | Build verification | Run `npm run build`, fix all TypeScript errors | HIGH |

---

## 11. How to Implement Each Remaining Task

---

### Task 1 — Wire SendSMSPage to the live store

**File:** `src/pages/SendSMSPage.tsx`

**Step 1:** Add store actions to the destructure at line 14:
```typescript
const {
  isDarkMode, addNotification,
  smsCredits, balanceUGX,                    // ADD these
  deductCredits, updateSmsStats,             // ADD these
  addCampaign, addTransaction,               // ADD these
} = useDashboardStore();
```

**Step 2:** Find the `handleSend` function and replace the body:
```typescript
const handleSend = () => {
  if (!message.trim()) {
    addNotification({ type: 'error', title: 'Empty Message', message: 'Please write a message first.' });
    return;
  }

  // Count recipients
  const count = smsType === 'single' ? 1 : 5; // use actual recipient count if available

  if (smsCredits < count) {
    addNotification({ type: 'error', title: 'Insufficient Credits', message: `Need ${count} credits, have ${smsCredits}.` });
    return;
  }

  setSending(true);
  setTimeout(() => {
    // 1. Deduct credits
    deductCredits(count);

    // 2. Update delivery stats
    updateSmsStats({
      sent: /* store.smsStats.sent + count */,   // get via useDashboardStore.getState()
      delivered: /* store.smsStats.delivered + count */,
    });

    // 3. Log as a campaign
    addCampaign({
      name: `${smsType === 'bulk' ? 'Bulk' : 'Single'} SMS — ${new Date().toLocaleDateString()}`,
      sender,
      sent: count,
      delivered: count,
      rate: 95.0,
      status: 'completed',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    });

    // 4. Log as a transaction
    addTransaction({
      type: 'usage',
      method: `Send SMS (${smsType})`,
      amount: -(count * 20),
      credits: -count,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'success',
    });

    // 5. Toast
    addNotification({
      type: 'success',
      title: '📤 SMS Sent!',
      message: `${count} message${count > 1 ? 's' : ''} sent. ${smsCredits - count} credits remaining.`,
    });

    setSending(false);
    setMessage('');
  }, 1200);
};
```

**Step 3:** Show live balance in the cost estimator panel.
Find any hardcoded `UGX 245,000` or `4,900 credits` text and replace with:
```tsx
<span>UGX {balanceUGX.toLocaleString()}</span>
<span>{smsCredits.toLocaleString()} credits remaining</span>
```

To read current stats inside the timeout callback, use:
```typescript
const { smsStats } = useDashboardStore.getState();
```

---

### Task 2 — Fix Sidebar bell button onclick

**File:** `src/components/Sidebar.tsx`

Find the bell button block (search for `<Bell`). The `onClick` currently calls
`setChatOpen(!isChatOpen)` — change it to open the notification panel:

```tsx
// FIND this:
onClick={() => setChatOpen(!isChatOpen)}

// REPLACE with:
onClick={() => setNotificationPanelOpen(!isNotificationPanelOpen)}
```

The variables `setNotificationPanelOpen`, `isNotificationPanelOpen`, `appNotifications`,
and `unread` are already destructured from the store at the top of the component.

---

### Task 3 — Live KPIs in AnalyticsPage

**File:** `src/pages/AnalyticsPage.tsx`

**Step 1:** Add to the store destructure:
```typescript
const { isDarkMode, smsStats } = useDashboardStore();
```

**Step 2:** Replace the hardcoded metric values in the KPI cards array:
```typescript
const metrics = [
  {
    label: 'Avg Delivery Rate',
    value: smsStats.deliveryRate,      // was: 95.05
    suffix: '%', decimals: 2,
    trend: 0.3, icon: TrendingUp, color: 'text-[#10B981]'
  },
  {
    label: 'Peak Send Hour',
    value: 11,                          // keep static — no data for this yet
    suffix: 'AM', decimals: 0,
    trend: 0, icon: Sparkles, color: 'text-[#2563EB]'
  },
  {
    label: 'Failed SMS',
    value: smsStats.failed,            // was: hardcoded
    suffix: '', decimals: 0,
    trend: -0.1, icon: TrendingDown, color: 'text-amber-500'
  },
  {
    label: 'Total Sent',
    value: smsStats.sent,              // was: hardcoded
    suffix: '', decimals: 0,
    trend: 0.3, icon: TrendingDown, color: 'text-red-400'
  },
];
```

---

### Task 4 — Wire AnomalyBanner to live notifications

**File:** `src/components/AnomalyBanner.tsx`

Currently shows a static hardcoded message. Replace with:

```typescript
import { useDashboardStore } from '../store/dashboardStore';

export default function AnomalyBanner() {
  const { appNotifications, isDarkMode, setNotificationPanelOpen } = useDashboardStore();

  // Show the most recent critical or warning notification
  const critical = appNotifications.find(n =>
    (n.type === 'critical' || n.type === 'warning') && !n.read
  );

  if (!critical) return null;

  return (
    <div className={`...your existing styling...`}>
      <span>{critical.title}</span>
      <span>{critical.summary}</span>
      <button onClick={() => setNotificationPanelOpen(true)}>
        View Details
      </button>
    </div>
  );
}
```

---

### Task 5 — SettingsPage store wiring

**File:** `src/pages/SettingsPage.tsx`

The profile form and password form fire toasts but don't persist.

**For profile save:** The store doesn't currently have a user profile object.
The simplest fix is to add it to the store:

```typescript
// In dashboardStore.ts, add to DashboardState interface:
userProfile: { name: string; email: string; phone: string; company: string; website: string; timezone: string };
updateUserProfile: (patch: Partial<DashboardState['userProfile']>) => void;

// In the create() call:
userProfile: { name: 'John Mukasa', email: 'john.mukasa@pahappa.com', phone: '+256 701 234 567', company: 'Pahappa Limited', website: 'https://pahappa.com', timezone: 'Africa/Kampala' },
updateUserProfile: (patch) => set(s => ({ userProfile: { ...s.userProfile, ...patch } })),
```

Then in `SettingsPage.tsx`, read from `store.userProfile` instead of local state.

**For the password change demo gate:** The chatbot uses `admin123`.
To make them consistent, either:
- Add `store.userPassword = 'admin123'` (insecure but fine for demo)
- Or keep it hardcoded in both files as `'admin123'`

---

### Task 6 — Clean TypeScript Build

Run this command from the project root:
```bash
npm install
npm run build
```

Common errors to look for and fix:

| Error type | How to fix |
|------------|------------|
| `'x' is declared but never used` | Remove the unused import or variable |
| `Property 'x' does not exist on type 'Y'` | Add the property to the interface in `dashboardStore.ts` |
| `Cannot find module '../data/mockData'` | Check import path is relative and correct |
| `Type 'string' is not assignable to type 'CampaignStatus'` | Cast with `as 'scheduled'` or add to the union type |
| `Parameter 'x' implicitly has type 'any'` | Add an explicit type annotation |

If a parameter is intentionally unused, prefix it with `_`:
```typescript
// This suppresses the noUnusedParameters error:
const handleUnlock = (msgId: string, _pw: string) => { ... }
```

---

## 12. Quick Reference Card

### "I want to show live data on a page"
1. Destructure the value from `useDashboardStore()` at the top of the component
2. Use it directly in JSX — Zustand auto-updates the component on change
3. Remove any hardcoded equivalent

### "I want a user action to update data"
1. Get the action from `useDashboardStore()`: `const { addCampaign } = useDashboardStore()`
2. Call it inside your event handler: `addCampaign({ name, sender, ... })`
3. Fire a toast: `addNotification({ type: 'success', title: '...', message: '...' })`
4. Optionally trigger a rating: `requestRating('Action Name', (stars, comment) => {})`

### "I want EgoBot to do something new"
1. Open `src/components/AIChatbot.tsx`
2. In `parseIntent()`, add a new regex check that returns `{ intent: 'my-action', security: 'safe', slots: {} }`
3. In `handleSend()`, add `case 'my-action': /* call store action */; break;`

### "I want a new AI notification rule"
1. Open `src/components/AINotificationEngine.tsx`
2. Add a new key to the `COOLDOWN` object: `my_rule: 10 * 60_000`
3. In the appropriate `check*` function (or a new one), add:
```typescript
if (someCondition && canFire('my_rule')) {
  add({
    type: 'warning',           // critical | warning | info | success | prediction
    category: 'delivery',      // balance | delivery | campaign | contacts | api | system | billing
    title: '⚠️ Title Here',
    summary: 'Short one-liner for the list view',
    cause: 'Why this is happening in detail.',
    prediction: 'What will happen if this is ignored.',
    solution: 'Step-by-step recommended action.',
    actionLabel: 'Go to Page',
    actionPage: 'analytics',   // optional — navigates on button click
  });
}
```
4. Call your new function inside the `evaluate()` closure in the useEffect

### "I want to add a new tutorial step"
1. Open `src/components/TutorialOverlay.tsx`
2. Add `data-tutorial="my-key"` to the target DOM element in the appropriate component
3. Add a new entry to the `STEPS` array:
```typescript
{
  selector: 'my-key',
  page: 'contacts' as const,   // navigate here first (or null)
  title: '👥 Step Title',
  description: 'Explain what this does.',
  clickLabel: 'Clicking the element...',
  simulateClick: true,          // fires .click() on the element
  autoAdvance: 2500,            // ms before auto-advancing (null = manual only)
}
```

---

## 13. File-by-File Completion Status

| File | Status | Notes |
|------|--------|-------|
| `src/store/dashboardStore.ts` | ✅ Complete | Full live state with all CRUD actions |
| `src/App.tsx` | ✅ Complete | All overlays mounted, no unused imports |
| `src/pages/DashboardPage.tsx` | ✅ Complete | Live KPIs, live campaigns table |
| `src/pages/SendSMSPage.tsx` | ❌ Incomplete | Send button not wired to store |
| `src/pages/ContactsPage.tsx` | ✅ Complete | Full CRUD, ratings, CSV import |
| `src/pages/CampaignsPage.tsx` | ✅ Complete | Full CRUD modal, live stats |
| `src/pages/BillingPage.tsx` | ✅ Complete | Live balance, live topup, transaction log |
| `src/pages/AnalyticsPage.tsx` | ⚠️ Partial | Charts live, KPI text hardcoded |
| `src/pages/ReportsPage.tsx` | ✅ Complete | Live campaigns, live KPIs, live charts |
| `src/pages/APIPage.tsx` | ✅ Complete | Mock API key management |
| `src/pages/SettingsPage.tsx` | ⚠️ Partial | UI complete, save doesn't persist to store |
| `src/components/Sidebar.tsx` | ⚠️ Bug | Bell onClick calls setChatOpen not setNotificationPanelOpen |
| `src/components/TopBar.tsx` | ✅ Complete | Live bell count, panel toggle |
| `src/components/AIChatbot.tsx` | ✅ Complete | 20+ intents, confirm/reject/password-gate |
| `src/components/AINotificationEngine.tsx` | ✅ Complete | 10 rules, 30s polling |
| `src/components/NotificationPanel.tsx` | ✅ Complete | Filter tabs, expandable cards |
| `src/components/TutorialOverlay.tsx` | ✅ Complete | DOM click sim, autoplay, 8 steps |
| `src/components/Charts.tsx` | ✅ Complete | Reads store.chartData |
| `src/components/ToastNotifications.tsx` | ✅ Complete | Progress bar, pause, action button |
| `src/components/RatingModal.tsx` | ✅ Complete | 5-star, comment, success animation |
| `src/components/FeedbackWidget.tsx` | ✅ Complete | Mood, category, message, email |
| `src/components/AnomalyBanner.tsx` | ❌ Incomplete | Still static hardcoded text |
| `src/components/KPICard.tsx` | ✅ Complete | No changes needed |
| `src/components/AIInsightsPanel.tsx` | ⚠️ Partial | Reads static mockData aiInsights |

**Total: 18 complete / 5 partial or incomplete / 1 untested build**

---

*Documentation written: June 2026*
*Project: EgoSMS Pro Dashboard — Pahappa Limited, Uganda*
