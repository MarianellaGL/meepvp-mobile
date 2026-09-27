# MeepVP mobile

Expo SDK 57 app for board-game scoring sheets, game sessions, winner tracking, and player statistics. It uses the published `@decodadev02/scoreui` design system and the separate [MeepVP API](https://github.com/MarianellaGL/meepvp-api).

## Run locally

1. Start PostgreSQL and the API using the API repository's README.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the API origin. On a physical phone, use your computer's LAN IP; `localhost` refers to the phone.
3. Install dependencies and start Expo:

```sh
pnpm install --ignore-scripts
npx expo start
```

The `--ignore-scripts` flag avoids the unrelated `unrs-resolver` build-script policy failure. You can also start Android, iOS, or web with `npx expo start --android`, `--ios`, or `--web`.

Image OCR uses `expo-text-extractor` and requires a native development or production build on iOS or Android. It does not run in Expo Go or on web. Build locally with `npx expo run:android` or `npx expo run:ios`, or use an EAS development build.

## Features and API routes

| Feature | API route |
| --- | --- |
| Sign up, log in, log out | `POST /v1/auth/signup`, `/login`, `/logout` |
| Profile stats and account history | `GET /v1/me`, `/v1/me/stats`, `/v1/me/sessions` |
| Attach the current anonymous game after signup | `POST /v1/me/claim-session` |
| Check API connection | `GET /health` |
| Import BoardGameGeek collection and read rules discussions | `GET /v1/bgg/collections/{username}`, `GET /v1/bgg/games/{gameID}/rules` |
| List all scoring sheets from the database and create one | `GET /v1/scoring-rules`, `POST /v1/scoring-rules` |
| Search shared sheets | `GET /v1/community/scoring-rules` |
| Preview selectable text from PDFs | `POST /v1/pdf/extract` |
| Anonymous table and game session | `POST /v1/tables`, `POST /v1/tables/{code}/sessions`, `GET /v1/sessions/{id}` |
| Player and scoring controls | `POST /v1/sessions/{id}/players`, `PATCH /v1/sessions/{id}/scores`, `POST /v1/sessions/{id}/points` |
| Finish or reopen a game | `POST /v1/sessions/{id}/finish`, `POST /v1/sessions/{id}/reopen` |
| Schedule a game | `GET/POST /v1/tables/{code}/scheduled-games`, `PATCH /v1/scheduled-games/{id}/rule`, `/session` |

Library refreshes the database's scoring-sheet list whenever it opens and offers a manual refresh button. The host can finish a game; the API returns the winner or all tied winners based on the sheet's highest/lowest total setting. Signed-in players can see their own completed games, wins, ties, and points in Profile and History.

## Accounts, local data, and sharing

Accounts use a username and password. A bearer session token is saved in Expo SecureStore on iOS and Android; the web build uses localStorage. A logged-in host's new game sessions are linked to that account. After signup or login, the app tries to attach the most recent locally saved session using its table host token and player ID. Older games without that proof cannot be assigned automatically. Anonymous play remains available.

The table host token and most recent game remain on the device. Imported collections, scoring sheets, and extracted PDF text have local snapshots for offline viewing. The API persists scoring sheets and sessions in PostgreSQL. PDF extraction does not retain the original PDF.

Sharing a sheet with the community requires login. The share switch sets `isPublic: true`. Sheets without that flag are omitted from community search, but `GET /v1/scoring-rules` currently returns every sheet to anyone who can reach the API. Treat them as unlisted, not confidential. Publication moderation and password recovery are not implemented yet.

The image reader recognizes text locally from a photo or screenshot. It shows editable OCR text and requires manual review of fields and point values before saving a scoring sheet. PDF OCR, scanned PDF pages, and web image OCR are not available yet. Game reminders are local notifications; remote push delivery is not configured.

## Checks

```sh
npx expo lint
npx tsc --noEmit
```
