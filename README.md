# Teleparty Chat App

A React + TypeScript SPA built for the Teleparty Full-Stack Engineer Challenge.

## Tech Stack

*   React 19 + TypeScript
*   Vite
*   MUI v5
*   Zustand + Immer + persist
*   @tanstack/react-virtual
*   React Hook Form + Zod
*   `teleparty-websocket-lib`
*   Vitest + @testing-library/react + MSW
*   ESLint + Prettier

## Features

- **Real-time Chat**: Send and receive messages instantly
- **Room Creation/Joining**: Create new chat rooms or join existing ones
- **Message History**: View previous messages when joining a room
- **User Presence**: See who's online and typing indicators
- **User Avatars**: Upload and manage your profile icon (stored in localStorage)
- **Dark/Light Mode**: Toggle between themes (stored in localStorage)
- **Responsive Design**: Works on mobile and desktop devices

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

## Available Scripts

| Command          | Description                                  |
|------------------|----------------------------------------------|
| `npm install`    | Install dependencies                         |
| `npm run dev`    | Start development server                     |
| `npm run build`  | Build for production                         |
| `npm run preview`| Preview production build                     |
| `npm run lint`   | Run ESLint                                   |
| `npm run test`   | Run tests with Vitest                        |
| `npm run type-check` | Check TypeScript types                   |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Deployment

The app is automatically deployed to GitHub Pages through the CI/CD pipeline when changes are pushed to the main branch. The deployment workflow consists of:

1. Linting the code
2. Running tests
3. Building the application
4. Deploying to GitHub Pages

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page-level components
- `/src/providers` - Context providers
- `/src/stores` - Zustand state stores
- `/src/theme` - Theme configuration
- `/src/utils` - Utility functions

## TODO (Challenge Steps)

- [x] **STEP 2:** Implement socket layer + stores (`SocketProvider`, Zustand stores, tests).
- [x] **STEP 3:** Implement Landing Page with Room Creation/Joining Form (MUI Tabs, RHF+Zod validation, tests).
- [x] **STEP 4:** Implement chat room interface (ChatHeader, MessageList with virtualization, MessageInputBar, routing).
- [x] **STEP 5:** Enhance presence features (typing indicators, load previous messages, user avatars, theme toggle).
- [x] **STEP 6:** Set up CI/CD pipeline (GitHub Actions, deployment to GitHub Pages).
- [x] **STEP 7:** Add comprehensive tests (unit, integration, e2e).

## Open Questions & Future Improvements

1. **WebSocket Reconnection Strategy**
   - The current reconnection strategy uses exponential backoff but might benefit from more sophisticated handling of different error cases.

2. **Message Persistence**
   - Messages are currently stored in memory. For production, a more robust persistence layer would be needed.

3. **User Authentication**
   - Currently using simple nicknames. A proper auth system would be needed for production.

4. **Accessibility**
   - More thorough accessibility testing and improvements are needed, particularly for screen readers.

5. **End-to-End Encryption**
   - For secure private chats, implementing E2E encryption would be valuable.

6. **Mobile Native Experience**
   - Wrapping the application in React Native for a better mobile experience.
