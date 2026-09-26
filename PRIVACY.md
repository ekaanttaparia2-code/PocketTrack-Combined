# Privacy Policy for PocketTrack

**Last updated:** August 26, 2026

PocketTrack ("we", "our", or "app") is designed from the ground up to protect your personal and financial privacy.

### 1. Data Ownership
- All financial data, transactions, ledgers, notes, and records belong solely to you.
- We do not sell, rent, monetize, or share your financial data with third-party advertisers.

### 2. Information Storage & Cloud Sync
- **Local Storage / Offline Persistence**: Your entries are cached on your device using IndexedDB and `localStorage` for offline functionality.
- **Cloud Sync**: When signed in, entries sync securely with your private account on Google Firebase Firestore using encrypted HTTPS/WSS protocols.

### 3. Voice & Microphone Permissions
- The microphone is used exclusively for speech-to-text transaction input when you tap the mic button.
- Audio is processed through the browser's standard Web Speech API. We do not store raw audio recordings on any server.

### 4. Clipboard & Notification Parsing
- The Smart Logger feature accesses text you explicitly paste from the clipboard to parse transaction amounts and merchants. It never reads your clipboard without your direct action.

### 5. Security & Authentication
- Authentication is handled via Firebase Authentication (Email/Password, Google Sign-In). Passwords are never accessible to app developers.

### 6. Contact & Data Deletion
- You can permanently delete all your data at any time from the app settings via the "Clear all" feature or by contacting support.
