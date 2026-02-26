# 🎬 CineHub — Netflix-Inspired Streaming Platform

> A full-stack streaming platform built with React, Firebase & TMDB API — featuring real authentication, watchlist, live search, and more.

![CineHub Banner](./src/images.png)

## 🔗 Live Demo
🚀 **[Coming Soon on Vercel](#)** — *(link will be updated after deployment)*

## 📌 GitHub
[github.com/Shivam954629/CineHub_Clone](https://github.com/Shivam954629/CineHub_Clone)

---

## ✨ Features

### 🎥 Content
- 🏠 **Hero Banner** — Auto-rotating trending movies with smooth transitions, dots & arrows
- 🎬 **Movies Page** — Browse with genre filters (Action, Comedy, Horror, etc.) + Bollywood filter
- 📺 **TV Shows Page** — Trending, Top Rated, Popular, Airing Today categories
- 🔥 **New & Popular** — Weekly trending movies & TV shows
- 🎭 **Movie Detail Page** — Full details with cast, ratings, genres, tagline & trailer modal

### 🔐 Authentication
- 📧 Email/Password signup & login
- 🔵 Google OAuth (one-click login)
- 🔒 Firebase Auth with persistent sessions

### 📋 Watchlist
- ➕ Add/Remove movies from watchlist
- 💾 Real-time sync with Firebase Firestore
- 🔔 Live notifications when movie is added

### 🔔 Notifications
- Real-time bell notifications on watchlist add
- Delete individual notifications
- Clear all notifications
- Persists across page refreshes (localStorage)

### 🔍 Search
- Live search with 400ms debounce
- Context-aware: searches Movies or TV Shows based on current page
- Shows poster, title, year & rating in dropdown

### ⚙️ Settings
- Display name update
- Password change (email users)
- Notification preferences
- Playback quality selector

### 📱 Responsive Design
- Mobile-first hamburger menu
- Optimized for all screen sizes
- Smooth animations & transitions

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| **React 18** | Frontend framework |
| **Vite** | Build tool & dev server |
| **Firebase Auth** | User authentication |
| **Firebase Firestore** | Real-time database (watchlist) |
| **TMDB API** | Movies & TV shows data |
| **React Router v6** | Client-side routing |
| **React Toastify** | Toast notifications |
| **CSS3** | Custom styling & animations |

---

## 📸 Screenshots

### 🏠 Home Page
![Home](./public/live.png)

### 🎬 Movie Detail
> Full movie details with cast, trailer modal & watchlist button

### 📺 TV Shows
> Browse TV shows by category with play button overlay

### 🔍 Live Search
> Real-time search with poster previews

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- TMDB API key

### Installation

```bash
# Clone the repo
git clone https://github.com/Shivam954629/CineHub_Clone.git

# Navigate to project
cd CineHub_Clone

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables
Create a `.env` file in the root:

```env
VITE_TMDB_TOKEN=your_tmdb_bearer_token
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
src/
├── Components/
│   ├── Navbar/          # Navigation with search & notifications
│   ├── TitleCards/      # Horizontal scrollable movie cards
│   └── Footer/          # Footer with social links
├── pages/
│   ├── Home/            # Hero banner + movie rows
│   ├── Login/           # Auth page (email + Google)
│   ├── Movies/          # Movies with genre filter
│   ├── TVShows/         # TV shows with category tabs
│   ├── NewPopular/      # Trending content
│   ├── MovieDetail/     # Full movie/TV detail page
│   ├── Watchlist/       # User's saved movies
│   ├── Player/          # Trailer player page
│   └── Settings/        # User settings
├── firebase.js          # Firebase config & auth functions
└── App.jsx              # Routes & auth guard
```

---

## 🔥 Key Highlights

- ⚡ **Real-time data** — Firestore `onSnapshot` for live watchlist sync
- 🛡️ **Auth guard** — Protected routes with `onAuthStateChanged`
- 🧠 **Smart search** — Debounced API calls to avoid rate limiting
- 📦 **Memory leak prevention** — Proper cleanup in all `useEffect` hooks
- 🎨 **Netflix-inspired UI** — Dark theme, smooth animations, hover effects

---

## 🌐 Deployment

Deploy on Vercel:

```bash
npm run build
# Upload dist/ to Vercel or connect GitHub repo
```

> ⚠️ Add all `.env` variables in Vercel's Environment Variables settings

---

## 👨‍💻 Developer

**Shivam** — Frontend Developer  
📧 GitHub: [@Shivam954629](https://github.com/Shivam954629)

---

## 📄 License

MIT License — feel free to use this project for learning purposes.

---

*Built with ❤️ using React + Firebase + TMDB API*
