# Teleparty Chat App

A modern real-time chat SPA built with React, TypeScript, and Vite for the Teleparty Full-Stack Engineer Challenge.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (fast dev/build tooling)
- **MUI v5** (Material UI)
- **Zustand** (state management) + **Immer** + **persist**
- **@tanstack/react-virtual** (virtualized lists)
- **React Hook Form** + **Zod** (form validation)
- **teleparty-websocket-lib** (WebSocket client)
- **Vitest** + **@testing-library/react** + **MSW** (testing)
- **ESLint** + **Prettier** (linting/formatting)

## Features

- **Real-time Chat**: Instant message sending and receiving via WebSocket
- **Room Creation & Joining**: Create new chat rooms or join by ID (UUID)
- **Message History**: Loads previous messages when joining a room
- **User Presence**: See who is online and typing (typing indicators)
- **User Avatars**: Upload, compress, and manage your profile icon (stored in localStorage)
- **Dark/Light Mode**: Toggle and persist theme preference
- **Responsive Design**: Mobile and desktop friendly
- **Connection Status**: Live indicator for WebSocket connection state
- **Robust Error Handling**: User-friendly errors for connection, joining, and form validation
- **Comprehensive Testing**: Unit and integration tests for stores, providers, and UI
- **CI/CD**: Automated lint, test, build, and deploy to GitHub Pages

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          React App                              │
│                                                                 │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐  │
│  │   Pages       │     │  Components   │     │  Providers    │  │
│  │               │     │               │     │               │  │
│  │ - LandingPage │     │ - RoomForm    │     │ - SocketProv  │  │
│  │ - ChatRoomPage│     │ - MessageList │     │ - ThemeProv   │  │
│  │               │     │ - ChatHeader  │     │               │  │
│  └───────┬───────┘     └───────┬───────┘     └───────┬───────┘  │
│          │                     │                     │          │
│          └───────────┬─────────┴─────────┬───────────┘          │
│                      │                   │                      │
│               ┌──────┴──────┐    ┌──────┴──────┐                │
│               │  Zustand    │    │   Utilities  │               │
│               │  Stores     │    │              │               │
│               │             │    │ - debounce   │               │
│               │ - chatStore │    │ - validation │               │
│               │ - roomStore │    │              │               │
│               │ - userStore │    │              │               │
│               │ - presence  │    │              │               │
│               └──────┬──────┘    └──────────────┘                │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
           ┌───────────┴────────────┐
           │  WebSocket Connection  │
           │                        │
           │ teleparty-websocket-lib│
           └───────────┬────────────┘
                       │
                       ▼
           ┌─────────────────────────┐
           │   Teleparty Backend     │
           │                         │
           │  (WebSocket Server)     │
           └─────────────────────────┘
```

## Usage

### Available Scripts

| Command               | Description                                  |
|-----------------------|----------------------------------------------|
| `npm install`         | Install dependencies                         |
| `npm run dev`         | Start development server                     |
| `npm run build`       | Build for production                         |
| `npm run preview`     | Preview production build                     |
| `npm run lint`        | Run ESLint                                   |
| `npm run test`        | Run tests with Vitest                        |
| `npm run type-check`  | Check TypeScript types                       |

### Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/teleparty-chat/` (or `/` if running locally) to use the app.

## Project Structure

- `/src/components` - Reusable UI components (chat, forms, avatar, theme, etc.)
- `/src/pages` - Page-level components (LandingPage, ChatRoomPage)
- `/src/providers` - Context providers (SocketProvider, ThemeProvider)
- `/src/stores` - Zustand state stores (chat, room, user, presence)
- `/src/theme` - Theme configuration
- `/src/utils` - Utility functions (debounce, etc.)
- `/test` - Test setup files
- `/docs` - Documentation and quick reference

## Testing

- Run all tests: `npm run test`
- Coverage reports: `npm run test -- --coverage`
- Tests cover Zustand stores, providers, and UI components (see `src/stores/__tests__`, `src/components/__tests__`, etc.)

## Deployment

- CI/CD via GitHub Actions: Lint, test, build, and deploy to GitHub Pages on push to `main`.
- See `.github/workflows/ci.yml` for details.

## Notable Implementation Details

- **WebSocket Connection**: Robust reconnection with exponential backoff, error handling, and live status indicator.
- **State Management**: Zustand stores for chat, room, user, and presence, with Immer for immutability and persist for localStorage.
- **Avatar Upload**: Image compression, quality slider, and validation for avatars.
- **Typing Indicators**: Real-time typing status with debounce and inactivity timeout.
- **Form Validation**: Room/nickname validation with user feedback.
- **Accessibility**: MUI components, ARIA labels, keyboard navigation, and color contrast.
- **Testing**: Mocked stores, socket, and UI for reliable tests.

## TODO & Future Improvements

- [ ] **Message Persistence**: Persist messages beyond memory (e.g., localStorage or backend)
- [ ] **User Authentication**: Add real user accounts/auth
- [ ] **Accessibility**: Further improvements for screen readers and a11y
- [ ] **End-to-End Encryption**: For private/secure chats
- [ ] **Mobile Native Experience**: Consider React Native or PWA
- [ ] **Advanced Presence**: Show online users, last seen, etc.
- [ ] **Better Error Handling**: More granular error messages and recovery

## License

MIT
