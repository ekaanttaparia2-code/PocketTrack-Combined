# 💜 PocketTrack — Smart AI Personal Finance & Expense Tracker

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Deploy-8b5cf6.svg)](https://github.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-4ade80.svg)](manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange.svg)](https://firebase.google.com/)

> **PocketTrack** is a modern, offline-first personal finance PWA built with a Cyberpunk/Neon glassmorphism design system. It combines smart voice expense logging, a context-aware AI intent engine, P2P debt ledger management, Splitwise-style group bill splitting, automated recurring expenses, and live health score insights.

---

## ✨ Key Features

- 🧠 **Phase 4 Smart Context & Intent Engine (`smart_engine.js`)**:
  - Automatically identifies People, Ledgers, Spaces, and Subscriptions from any entry.
  - Recognizes transaction direction (*Gave ₹* vs *Received ₹*), detects settlements/reimbursements, and prompts 1-tap balance updates.
- 🎙️ **Smart Voice Money Log (`voice.js`)**:
  - Tap the floating microphone button to log expenses naturally (e.g. *"Spent 350 on petrol"* or *"Got 15000 salary"*).
- 📑 **Person-to-Person Debt Ledger (`ledger.js`)**:
  - Track who owes you and what you owe friends and roommates with in-app history cards and real-time net balances.
- 👥 **Spaces & Bill Splitting (`app.js`)**:
  - Create trip or roommate groups (*Goa Trip, Flatmates*) with shared expenses and a greedy settlement minimization algorithm.
- ⚡ **Smart UPI Notification Logger (`app.js`)**:
  - Paste any payment notification from GPay, PhonePe, Paytm, or CRED. Automatically extracts merchant, amount, and category.
- 🔁 **Automated Recurring Expenses (`recurring.js`)**:
  - Auto-posts recurring rent, bills, and subscriptions (Daily, Weekly, Monthly, Yearly).
- 🤖 **Financial Health Score & AI Coach (`aicoach.js`)**:
  - 0–100 Financial Health Score with subscription leak detection and dynamic goal calculators (*e.g., iPhone in 2 months*).
- ☁️ **100% Offline-First Cloud Sync (`offline.js` / `sw.js`)**:
  - Full IndexedDB caching and offline write queue. Works on airplane mode and auto-syncs when online.
- 🎨 **Pro Themes & Monetization (`monetization.js`)**:
  - Unlockable themes: *Cyberpunk Neon (Default)*, *Emerald Luxury*, *Sunset Glow*, and *Midnight OLED*.

---

## 📁 Repository Structure

```text
pocket-tracker/
├── index.html           # Main SPA application
├── landing.html         # Official product landing page & showcase
├── 404.html             # GitHub Pages single-page app fallback
├── styles.css           # Glassmorphism design tokens & styles
├── icons.css            # Tabler/custom icon definitions
├── smart_engine.js      # Phase 4 Smart Context & Intent Engine
├── app.js               # Core SPA navigation, state & event splitting
├── transactions.js      # Transaction CRUD, limits & composer
├── voice.js             # Speech-to-text NLP voice recording
├── ledger.js            # P2P debt ledger management
├── recurring.js         # Recurring rules & auto-posting
├── reports.js           # Insights, charts & PDF statement export
├── monetization.js      # Pro subscriptions & custom themes
├── aicoach.js           # Health score & floating AI assistant
├── offline.js           # Offline connection & sync status monitor
├── auth.js              # Firebase authentication & verification
├── firebase.js          # Firebase config & service initialization
├── sw.js                # Service worker for offline caching
├── manifest.json        # Web App Manifest for mobile installation
├── .nojekyll            # Bypasses Jekyll processing on GitHub Pages
├── .gitignore           # Standard production gitignore
├── LICENSE              # MIT License
├── PRIVACY.md           # Privacy Policy
├── TERMS.md             # Terms of Service
└── README.md            # Project documentation
```

---

## 🚀 Getting Started & Deployment

### 1. Run Locally
Simply clone or download this repository and open `index.html` in any modern web browser. No `npm install` or build steps required.

### 2. Deploy to GitHub Pages
1. Push this folder to your GitHub repository (e.g. `main` or `gh-pages` branch).
2. In your repository settings on GitHub, navigate to **Pages**.
3. Under **Build and deployment** → **Branch**, select `main` (or root `/`) and click **Save**.
4. Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
