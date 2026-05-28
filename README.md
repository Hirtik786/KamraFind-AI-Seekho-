# 🏠 KamraFind (کمرہ فائنڈ)

KamraFind is a beautifully polished, high-fidelity room and accommodation finder designed specifically for university students in Karachi, Pakistan. It offers a secure, intuitive, and modern platform where students can find roommates, shared hostels, or private rentals, complete with Karachi-focused filters, interactive map rendering, real-time messaging, and an advanced AI-powered search assistant.

---

## 🚀 Tech Stack

KamraFind is architected as a robust, full-stack application leveraging state-of-the-art web technologies and secure cloud services:

### 1. Frontend (Client Tier)
*   **React 19**: Powered by functional components, modern Hooks (`useState`, `useEffect`, `useMemo`), and high-performance state synchronization.
*   **Tailwind CSS v4 & @tailwindcss/vite**: Ultra-fast, utility-first CSS framework delivering complex fluid grids, responsive breakpoints (`sm:`, `md:`, `lg:`), and custom-themed light/dark glassmorphic UI cards.
*   **Motion (`motion/react`)**: Implements elegant physical micro-interactions, spring-loaded transition animations, staggered list transitions, and slide-in overlays for a native application feel.
*   **Google Maps Platform (`@vis.gl/react-google-maps`)**: Interactive mapping coordinates pointing to major areas in Karachi (Gulshan, Johar, Clifton, Defence, etc.) and university hubs with custom markers, info bubbles, and location-grounded visualizers.
*   **Lucide React**: Lightweight vector icon framework for crisp UI controls.

### 2. Backend (Server Tier)
*   **Node.js & Express.js**: Handles server-side routing, Static Asset serving, and Vite Development Middleware orchestration in a unified execution structure.
*   **TypeScript Execution (`tsx`)**: Supports native ES Module execution directly in development.
*   **Google Gen AI (`@google/genai`)**: Integrates the advanced Gemini API server-side to proxy student queries, parse natural language accommodation requests, and provide listings matching breakdowns without exposing credentials.
*   **Resend SDK**: High-deliverability backend notification system for automatic student matching and system telemetry.

### 3. Database & Authentication Services (Serverless)
*   **Google Firebase Suite**:
    *   **Cloud Firestore Database**: NoSQL structure providing real-time data streaming (using `onSnapshot` updates) for continuous synchronicity in listings, student chat messages, and area reviews.
    *   **Firebase Authentication**: Robust, secure client-side and server-side authentication flows verifying university credentials and student profiles.
*   **Client-Side Persistence**:
    *   **Browser LocalStorage**: Leveraged for ultra-responsive local states such as saved searches, room comparison lists, and interactive viewing histories.

---

## 🎨 Distinctive App Features

*   **⚡ Dhondho Hub (Smart Finder)**: Dual list/map interface dynamically localized in either **English** or **Urdu (اردو)**. Includes precise filters for Rent Budget, Meals, Air Conditioning, Attached Baths, Furnishing, Wifi, and specific nearby universities (e.g., FAST-NUCES, KU, NED, SZABIST, Habib, IBA).
*   **🤖 AI Student Assistant**: An automated chat-assistant powered by Gemini, capable of directly exploring active listings, formulating smart area summaries, and helping students negotiate budgets.
*   **🔒 Secure Student Profiles**: Verify listings with user ownership badges. Securely includes private student credentials (phone/WhatsApp) reachable via direct, secure call links.
*   **✨ Customized Reporting & Deletion Engine**:
    *   **Secure Reporting Modal**: Allows students to report fake rooms, inaccurate pricing, or inappropriate behaviors. Reports are routed directly to system administration via Cloud databases without page refreshing.
    *   **Self-Service Deletion**: Property owners can instantly manage their profile, hide rooms, or permanently delete room posts through beautiful popups with transition animations.
*   **⚔️ Dynamic Room Compare**: Select up to 3 listings to view in a side-by-side spec comparison chart analyzing amenities, rent rates, distance to universities, and suitability scores.

---

## 📂 Project Directory Structure

```bash
├── .env.example             # Documented template for sensitive server/client environment variables
├── .gitignore               # Excludes build artifacts and dependencies from deployment
├── firebase-applet-config.json    # Local Firebase project parameters
├── firebase-blueprint.json  # Initial Firestore collections, document mock structures, and security configurations
├── firestore.rules          # Deployed Firebase Firestore permission restrictions
├── index.html               # Main entry HTML viewport
├── metadata.json            # Application metadata (Name, Description, and Permissions)
├── package.json             # Build commands, TS configuration parameters, and NPM packages
├── server.ts                # Express backend routing & Development Vite application middleware
├── tsconfig.json            # Strict-mode TypeScript compiler setup
├── vite.config.ts           # Bundler config utilizing @tailwindcss/vite plugins
└── src/                     # All React application source files
    ├── main.tsx             # DOM Root mounter
    ├── App.tsx              # Application layout root & global tab router (Dhondho / AI / Profile / Post)
    ├── index.css            # System CSS importing Tailwind theme fonts
    ├── types.ts             # Type definition interfaces for Listings, Messages, and Users
    ├── constants.ts         # Hardcoded Karachi landmarks, educational institutions, and translation dictionaries
    ├── firebase.ts          # Core Firebase SDK initialization and client validation pipelines
    └── components/          # High-fidelity architectural sub-components
        ├── DhondhoTab.tsx         # Primary search board with interactive layout cards
        ├── KarachiMap.tsx         # React Google Maps integration mapping geographic properties
        ├── ListingDetailModal.tsx # Full spec sheet detail view popup (AI Context, contact triggers, owner status)
        ├── ProfileTab.tsx         # User-facing student dashboards, listings, & authentication settings
        ├── PostListingTab.tsx     # Student Listing Creator wizard with smart image/field inputs
        ├── AIAssistantTab.tsx     # Fully-featured chat panel interacting with server-side AI query models
        ├── CompareModal.tsx       # Specialized side-by-side multi-listing parameter evaluator
        ├── PublicProfileModal.tsx # Publicly readable owner profiles displaying active listings
        └── RecentlyViewed.tsx     # LocalStorage-backed horizontal scroll slider tracking history
```

---

## 🛠️ Setup & Installation Instructions

### Prerequisite Environment Variables
Before running the application, define your configurations in a local `.env` file (copied from `.env.example`):

```env
# Google Maps Platform Key (required for KarachiMap component)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Google Gemini API Key (handled completely server-side for safety)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web App Parameters
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 1. Install Dependencies
Run npm installations to load node modules:
```bash
npm install
```

### 2. Launch Local Development Server
Boot up the full-stack server running TypeScript on port `3000`:
```bash
npm run dev
```

### 3. Build & Produce Standalone Executables
Compile the CSS layouts, the static React bundle, and bundle the server file:
```bash
npm run build
```

---

## 🛡️ Fire Safety and Integrity

KamraFind maintains a highly secure, privacy-first atmosphere:
*   **Server-Side Credentials**: Sensitive keys like the `GEMINI_API_KEY` are kept strictly in execution environments, accessible only via API proxy handlers, preventing leakage onto client browsers.
*   **Firebase Security Rules**: Controlled via rules defined in `firestore.rules` preventing unauthenticated alterations of student accounts, listing prices, or other listing documents.
*   **Modern Accessibility**: Employs responsive text scaling, dark mode contrasts, visual hints, and translation mechanisms (EN/UR) to include students of all backgrounds across Karachi.
