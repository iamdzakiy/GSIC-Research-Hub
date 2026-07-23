# 📦 Firebase - Centralized Database Architecture

## 🎯 Overview

Proyek **GSIC Hub** menggunakan **Firebase sebagai satu-satunya database** yang terpusat. Tidak ada database eksternal lain seperti PostgreSQL, MySQL, atau MongoDB.

## 🔥 Firebase Services Used

### 1. **Firebase Authentication** (`firebase/auth`)
- User management (sign up, sign in, sign out)
- Email verification
- Anonymous authentication
- Admin account generation

### 2. **Firebase Firestore** (`firebase/firestore`)
- NoSQL document-based database
- Real-time data synchronization
- Collections:
  - `users` - User profiles
  - `opportunities` - Research, scholarship, career, competition opportunities
  - `curated` - Curated opportunities
  - `events` - Bootcamp and sandbox events
  - `tests` - Pre/post tests for events
  - `testResults` - User test results
  - `registrations` - Event registrations
  - `documents` - User uploaded documents
  - `adminAccounts` - Generated admin accounts

### 3. **Firebase Storage** (`firebase/storage`)
- File uploads (avatars, posters, documents)
- Secure access control via Firebase Rules

## 📁 Architecture

```
┌─────────────────────────────────────────┐
│         GSIC Hub Application            │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      Firebase Client SDK          │  │
│  │  - firebase/app                   │  │
│  │  - firebase/auth                  │  │
│  │  - firebase/firestore             │  │
│  │  - firebase/storage               │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│                    ▼                     │
│  ┌───────────────────────────────────┐  │
│  │       Firebase Console            │  │
│  │  - Authentication                 │  │
│  │  - Firestore Database             │  │
│  │  - Storage                        │  │
│  │  - Security Rules                 │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
         │
         │ NO external databases
         │ (No PostgreSQL, MySQL, etc.)
         ▼
```

## 🔧 Configuration

### Environment Variables (`.env.local`)

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side only)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note:** Tidak ada `DATABASE_URL` karena tidak menggunakan PostgreSQL atau database eksternal lainnya.

## 📝 Code Structure

### `/lib/firebase.ts`
Inisialisasi Firebase dan export services:
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### `/lib/firestore.ts`
CRUD operations untuk semua collections:
```typescript
// Generic CRUD
export async function create<T>(collectionName: string, item: T)
export async function update<T>(collectionName: string, id: string, patch: Partial<T>)
export async function remove(collectionName: string, id: string)
export async function getAll<T>(collectionName: string): Promise<T[]>

// Domain-specific getters
export async function getOpportunities(): Promise<Opportunity[]>
export async function getEvents(): Promise<GSICEvent[]>
export async function getUserProfile(uid: string): Promise<UserProfile | null>
```

### `/lib/types.ts`
Type definitions untuk semua data models.

## 🔒 Security

### Firestore Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read, authenticated write
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Admin-only collections
    match /adminAccounts/{doc} {
      allow read, write: if false;
    }
  }
}
```

## 🚀 Advantages of Firebase-Only Architecture

1. **Real-time Updates** - Firestore listeners provide instant data sync
2. **Scalability** - Automatic scaling with Google infrastructure
3. **Security** - Built-in authentication and security rules
4. **Cost-effective** - Pay-as-you-go pricing model
5. **Simplified Stack** - No need to manage separate database servers
6. **Offline Support** - Firestore has built-in offline persistence

## ⚠️ Important Notes

- **Prisma schema** dipertahankan hanya untuk kompatibilitas, tapi tidak digunakan
- **Tidak perlu setup DATABASE_URL** atau database PostgreSQL eksternal
- Semua operasi database dilakukan melalui Firebase SDK
- Untuk production, pastikan Firebase billing sudah diaktifkan

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Pricing](https://firebase.google.com/pricing)
