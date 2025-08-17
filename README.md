# Smart Parking (Expo + FastAPI)

A mobile app + backend to start/track/finish parking sessions with plate capture, live pricing, and mock payments.

* **Frontend:** Expo (React Native) – iOS, Android, Web
* **Backend:** FastAPI + SQLAlchemy (PostgreSQL)
* **OCR:** Free, on-server Tesseract (with optional OCR.space fallback)
* **Live updates:** WebSocket stream for the running amount

---

## Features

* 📍 Nearby lots (uses device location & optional map view)
* 🚗 Start session by **typing plate** or **taking a photo** (server OCR normalizes to `RAD 788 D`)
* 💸 **Live price** while parked (WebSocket, \~3s ticks)
* 🧾 History; tap an **active** row to manage (Pay / Exit)
* 🌐 Mock payment page opens in-app WebView and deep-links back
* 🔐 Simple token login by phone (demo)

---

## Repo structure

```
smart-parking/
  app/                 # FastAPI backend (routers, models, services)
  frontend/            # Expo app (if you keep code in a subfolder; otherwise root files)
  App.tsx
  app.json
  config.ts
  package.json
  .gitignore
  ...
```

> If your frontend is at the repo root (current setup), just keep backend under `app/`.

---

## Prereqs

* **Node** 18+ and **npm**
* **Python** 3.11+
* **PostgreSQL** 13+ (or adjust `DATABASE_URL`)
* **Tesseract** (free OCR engine)

Install Tesseract:

* macOS: `brew install tesseract`
* Ubuntu: `sudo apt-get install -y tesseract-ocr`

---

## Backend setup (FastAPI)

1. Create `.env` next to `app/`:

```env
# DB & app
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/smart_parking
BASE_URL=http://localhost:8000
DEFAULT_CURRENCY=RWF

# OCR (optional fallback; free tier)
OCR_SPACE_API_KEY=helloworld
```

2. Install deps & run:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt  # or pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg httpx pytesseract opencv-python-headless python-dotenv pydantic-settings
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. Create some lots (quick SQL):

```sql
-- psql smart_parking
INSERT INTO parkinglot (id, name, lat, lng, price_per_hour)
VALUES
  ('kh-basement', 'Kigali Heights Basement', -1.9525, 30.0927, 2000)
ON CONFLICT DO NOTHING;
```

> If you have Alembic, run `alembic upgrade head` instead of manual SQL.

### WebSocket route

We expose:
`wss://<host>/sessions/{session_id}/ws` → JSON ticks `{type:"tick", amount_cents, currency, status, updated_at}`

---

## Frontend setup (Expo)

1. Install deps:

```bash
npm i
npm i expo@latest
npx expo install react react-dom react-native-web react-native-maps expo-location expo-camera expo-secure-store
```

2. Configure **`config.ts`**:

```ts
// config.ts
export const CONFIG = {
  API_BASE_URL: 'http://localhost:8000',  // or your LAN IP, or https://<ngrok>.ngrok-free.app
  WS_BASE_URL:  'ws://localhost:8000',    // wss://<ngrok> for ngrok/HTTPS
  CURRENCY: 'RWF',
};
```

For **ngrok**:

```ts
export const CONFIG = {
  API_BASE_URL: 'https://be5e7175e46b.ngrok-free.app',
  WS_BASE_URL:  'wss://be5e7175e46b.ngrok-free.app',
  CURRENCY: 'RWF',
};
```

3. Update **`app.json`** (important bits):

```json
{
  "expo": {
    "name": "smart-parking",
    "scheme": "smartparking",
    "ios": {
      "supportsTablet": true,
      "config": { "googleMapsApiKey": "YOUR_IOS_NATIVE_MAPS_KEY" },
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We use your location to find nearby parking lots.",
        "NSCameraUsageDescription": "We use the camera to capture your license plate."
      }
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "config": { "googleMaps": { "apiKey": "YOUR_ANDROID_NATIVE_MAPS_KEY" } },
      "permissions": ["ACCESS_FINE_LOCATION", "CAMERA", "RECORD_AUDIO"]
    },
    "web": { "favicon": "./assets/favicon.png" },
    "plugins": ["expo-secure-store"]
  }
}
```

4. Run the app:

```bash
npx expo start
# press i / a to launch simulator, or scan QR for device
```

---

## How it works (high-level)

* **Login:** `/auth/login` (demo) returns JWT; app stores in SecureStore.
* **Lots:** `/lots?lat&lng` returns nearby lots.
* **Start session:** POST `/sessions` with `{lot_id, plate? , photo_url?}`

    * If `plate` omitted and `photo_url` provided, backend downloads the image, runs **Tesseract**, normalizes to `RAD 788 D`.
    * If OCR fails and `ALLOW_UNKNOWN_PLATE=true`, server uses `UNKNOWN`.
* **Live amount:** WebSocket `/sessions/{id}/ws` pushes `amount_cents` every \~3s. Client shows it instantly and still polls via React Query as fallback.
* **Pay:** POST `/sessions/{id}/pay` returns a **mock** `payment_url`. In-app WebView opens it; on success it deep-links back (`smartparking://paid?...`).
* **Exit:** POST `/sessions/{id}/exit` finalizes session & amount.
* **History:** GET `/sessions/history?limit=30`; tapping an **active** row opens the Session screen (manage/pay/exit).

---

## API quick reference

```http
POST /auth/login
  { "phone": "+2507..." } -> { "token": "..." }

GET /lots?lat=-1.95&lng=30.09
  -> [{ id, name, lat, lng, price_per_hour }, ...]

POST /sessions
  { "lot_id": "kh-basement", "plate": "RAD 788 D" }
  or
  { "lot_id": "kh-basement", "photo_url": "https://..." }
  -> SessionOut

GET /sessions/{id}
  -> SessionOut

POST /sessions/{id}/pay
  -> { "payment_url": "https://..." }

POST /sessions/{id}/exit
  -> SessionOut (finalized)

GET /sessions/history?limit=30
  -> [SessionOut, ...]

WS  /sessions/{id}/ws
  -> {"type":"tick","amount_cents":1234,"currency":"RWF","status":"active","updated_at":"..."}
```

`SessionOut` includes:

```
id, lot_id, lot_name?, plate, started_at, ended_at?, status,
amount_cents?, currency, payment: { status, amount_cents, currency }, receipt_pdf_url?
```

---

## Using ngrok

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
ngrok http 8000
# set API_BASE_URL=https://<subdomain>.ngrok-free.app
# set WS_BASE_URL=wss://<subdomain>.ngrok-free.app
```

**Note:** If your WS path is under the router, use `/sessions/{id}/ws`. A 403 on WS usually means **wrong path**.

---

## Troubleshooting

* **400 on `/sessions`**
  Send **either** `plate` **or** a publicly reachable `photo_url`. Ensure `Content-Type: application/json` and Authorization header are set. Check server logs for `[LPR]`.

* **WS shows “403 Forbidden”**
  Wrong path. If the handler is `@router.websocket("/{session_id}/ws")` and router prefix is `/sessions`, the full path is `/sessions/<id>/ws`.

* **Amount doesn’t change**
  Verify WS connects (icon on Session screen shows “Live”). If behind HTTPS, use `wss://` for `WS_BASE_URL`. Also ensure backend uses **`datetime.utcnow()`** in the live estimator (matches DB’s naive timestamp).

* **OCR poor accuracy**
  Get closer to the plate (fills 30–50% width), reduce glare, make plate horizontal. You can also add a capture guide box and crop client-side before uploading.

---

## Scripts (suggested)

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "server": "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
  }
}
```

---

## Security notes

* Keys in `app.json` are **not secret**; restrict Google Maps keys in Console.
* For production, validate JWT on the **WebSocket** (`?token=...`) before `accept()`.

---

## License

MIT
