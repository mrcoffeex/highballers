# HighBallers

Pickup basketball runs for clubs — schedule games, shuffle balanced courts, record box scores, and keep your crew in one app.

Built with [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) (React Native 0.85, React 19) and [Supabase](https://supabase.com) for auth, database, and realtime.

## Features

### Clubs

- Create and join clubs (public or private)
- Club captain and sub-captain roles
- Member list with search, kick/ban, and sub-captain assignment
- Join requests for private clubs
- Captains must transfer leadership before leaving the club
- Club group chat with GIF support (GIPHY)

### Games

- Schedule open or invite-only games with location, map preview, and directions (Google Maps)
- Join/leave roster; creators and club captains can add members directly
- Shuffle players into balanced multi-court lineups (configurable players per court)
- Manual court assignment editor
- Scorekeeper with per-court box scores and game clock
- Game actions panel: join, shuffle, courts, roster, scorekeeper, edit, finish, or cancel — in one place

### Players

- Profiles with stats, ratings, and game history
- Leaderboards
- Light and dark theme (system or manual)

### Subscriptions

- **Basic Baller** and **All-Star Baller** tiers (in-app purchase via `expo-iap`)
- Tier limits on club count, event size, and premium features

## Tech stack

| Layer   | Choice                                                  |
| ------- | ------------------------------------------------------- |
| App     | Expo ~56, Expo Router, TypeScript                       |
| UI      | React Native, React Native Paper, custom theme tokens   |
| State   | Zustand                                                 |
| Backend | Supabase (Postgres, Auth, RLS, Storage)                 |
| Maps    | Leaflet (in-app preview), Google Maps URLs (directions) |
| Tests   | Vitest                                                  |
| Builds  | EAS Build                                               |

## Prerequisites

- **Node.js** 22.13+ (see [Expo SDK 56 requirements](https://docs.expo.dev/versions/v56.0.0/))
- **npm** (or compatible package manager)
- [Expo account](https://expo.dev) for dev client / EAS builds
- [Supabase project](https://supabase.com) with migrations applied
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli), Android Studio / Xcode for native dev

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/mrcoffeex/highballers.git
cd highballers
npm install
```

### 2. Environment variables

Copy the example env file and fill in your Supabase keys:

```bash
cp .env.example .env
```

Required:

| Variable                               | Description                                 |
| -------------------------------------- | ------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase project URL                        |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key — not the secret key |

Optional (see `.env.example` for full list):

- `EXPO_PUBLIC_GIPHY_API_KEY` — GIF search in club chat
- `EXPO_PUBLIC_APP_URL` — Public web URL for invite links
- `EXPO_PUBLIC_ALL_STAR_PRODUCT_ID` — IAP product ID
- OAuth redirect overrides for Expo Go / LAN dev

### 3. Supabase

Apply migrations from `supabase/migrations/` to your project (Supabase CLI or Dashboard SQL).

Configure **Auth → URL Configuration** with your OAuth redirect URLs, for example:

- `highballers://oauth-callback` (native)
- `http://localhost:8081/oauth-callback` (web dev)

For email OTP, set the Magic Link template to show the token (e.g. `Your code: {{ .Token }}`), not a link-only email.

### 4. Run the app

```bash
# Development (Metro, fast refresh)
npm run start:dev

# Web
npm run web:dev

# Android (device/emulator helper script)
npm run android:dev

# iOS simulator
npm run ios:dev
```

Scan the QR code with Expo Go, or use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) for full native modules (IAP, notifications, etc.).

## Scripts

| Command                      | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `npm run start:dev`          | Start Expo dev server                                |
| `npm run web:dev`            | Start for web                                        |
| `npm run android:dev`        | Android dev with LAN Metro host                      |
| `npm run android:dev:tunnel` | Android dev via tunnel                               |
| `npm run ios:dev`            | iOS dev                                              |
| `npm test`                   | Run Vitest unit tests                                |
| `npm run test:watch`         | Vitest watch mode                                    |
| `npm run build:apk`          | EAS preview APK (Android)                            |
| `npm run build:ios`          | EAS preview build (iOS)                              |
| `npm run build:mobile`       | EAS preview, both platforms                          |
| `npm run eas:env:push`       | Push env vars to EAS (see `scripts/push-eas-env.sh`) |

Production-style local runs (`npm start`, `npm run android`, etc.) use `--no-dev --minify`.

## EAS builds

Profiles in `eas.json`:

- **development** — dev client, internal distribution
- **preview** — internal APK (Android) for testing
- **production** — store-ready (AAB on Android, auto-increment)

```bash
npx eas-cli build --platform android --profile preview
```

Set `EXPO_TOKEN` or run `npm run expo:login` for non-interactive CI builds.

## Project structure

```
highballers/
├── app/                 # Expo Router screens (file-based routes)
│   ├── (tabs)/          # Home, clubs, chats, profile, create
│   ├── event/           # Game detail, create, edit, courts, stats
│   ├── auth.tsx         # Sign-in (email OTP, Google OAuth)
│   └── ...
├── components/          # UI and feature components
├── lib/                 # Business logic, theme, Supabase sync, tests
├── store/               # Zustand app store
├── supabase/
│   └── migrations/      # Postgres schema and RLS
├── assets/              # Icons, splash
├── app.json             # Expo config (version 1.0.1)
└── eas.json             # EAS Build profiles
```

## Permissions model (summary)

| Action                                          | Who                              |
| ----------------------------------------------- | -------------------------------- |
| Shuffle, edit game, courts, scorekeeper, finish | Game creator or **club captain** |
| Add players to game                             | Game creator or **club captain** |
| Cancel game, invite players (legacy manage)     | Creator, captain, or sub-captain |
| Transfer club captain                           | Current captain only             |
| Leave club as captain                           | Must transfer captain role first |

Game options lock **12 hours after scheduled tip-off** (or when marked finished).

## Testing

```bash
npm test
```

Tests live under `lib/__tests__/` (permissions, roster, invites, maps URLs, subscriptions, etc.).

## Documentation for contributors

- [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/) — use this version when changing Expo APIs (`AGENTS.md` in repo).
- Agent skills under `.agents/skills/` for Supabase and Postgres guidance.

## Contact

For privacy, terms, support, or account deletion requests: **gocotano.kentjohn@gmail.com**

In-app legal screens and mailto links use `EXPO_PUBLIC_LEGAL_EMAIL` when set (see `.env.example`); otherwise the address above is the default.

## License

See [LICENSE](LICENSE).

---

**HighBallers** · `com.highballers.app` · v1.0.1
