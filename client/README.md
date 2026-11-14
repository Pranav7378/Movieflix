# Movie Recommender Client

A modern, responsive React application for movie discovery and personalized recommendations.

## Features

- 🎬 **Movie Discovery**: Browse trending, popular, and top-rated movies
- 🔐 **Authentication**: Secure user authentication with Firebase
- ⭐ **Rating System**: Rate movies and get personalized recommendations
- 📝 **Watchlist**: Save movies to watch later
- 🔍 **Search**: Find movies by title or genre
- 📱 **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **React 18** - UI library
- **Redux Toolkit** - State management
- **Firebase** - Authentication
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Firebase account
- TMDB API key (optional, for movie posters)

### Installation

1. Clone the repository:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
   - Add your Firebase configuration
   - Add your API base URL
   - (Optional) Add TMDB API key

5. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── api/            # API clients and configurations
│   ├── app/            # Redux store configuration
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable components
│   ├── features/       # Feature-based modules (auth, movies)
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Layout components
│   ├── pages/          # Page components
│   ├── router/         # Routing configuration
│   ├── utils/          # Utility functions and constants
│   ├── index.css       # Global styles
│   └── main.jsx        # Application entry point
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_TMDB_API_KEY` | TMDB API key (optional) |

## Features in Detail

### Authentication
- Email/password registration and login
- Protected routes for authenticated users
- Persistent authentication state

### Movie Discovery
- Trending movies section
- Popular movies section
- Top-rated movies section
- Personalized recommendations (for logged-in users)

### Watchlist Management
- Add/remove movies from watchlist
- View all watchlisted movies on profile page
- Persistent across sessions

### Rating System
- Rate movies from 1-5 stars
- View your ratings on movie cards
- Ratings influence personalized recommendations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
