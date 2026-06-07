# 🎬 EZ Movies App

A modern movie and TV show browsing app built with React, TMDB API, and Firebase. Users can browse media, manage personal collections, and sync their preferences in real-time.

---

## 🚀 Features

- 🔍 **Live Search with Debounce**
- 🎞️ **Rich Media Discovery** — Trending, Popular, and Upcoming content via `MediaSlider` and `HeroCarousel`
- 🔐 **Firebase Authentication** — Secure sign-up and login workflows
- 📁 **Smart Playlists** — Create, name, and manage custom playlists; add movies and TV shows with metadata (year, rating, language)
- ❤️ **Real-time Favorites** — Instant synchronization of favorite movies and TV shows using Firestore snapshots
- 🎭 **Responsive Design** — Custom theming with Tailwind CSS, including portals for modal overlays

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| API | TMDB (The Movie Database) |
| Backend / Database | Firebase Authentication & Firestore |
| State Management | React Context API & `onSnapshot` for real-time data |

---

## 🔧 Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/banukajanith2/Movies-App.git
cd movies-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root and add the following keys:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### 4. Start the development server

```bash
npm run dev
```

---

## 🧠 Folder Structure

```
src/
├── components/         # Reusable UI (MovieCard, MediaSlider, HeroCarousel, Spinner)
├── context/            # AuthContext for global user state
├── firebase/           # Firebase config & Firestore utility functions
├── hooks/              # Custom hooks
├── constants/          # API configurations
└── App.jsx             # Main routing and layout
```

---

## 💻 Deployment

This app is fully compatible with:

- **Firebase Hosting** *(Recommended for Firestore/Auth apps)*
- Vercel / Netlify

---

## 🙋‍♂️ Author

**Banuka Janith**
GitHub: [@Banukajanith2](https://github.com/Banukajanith2)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
