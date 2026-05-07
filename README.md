# Travo

> AI-powered smart road intelligence for safer, smoother travel.

Travo is a mobile-first road safety platform that turns every driver into a real-time road guardian. Users can scan potholes and road hazards, submit verified complaints, receive AI safety alerts, compare safer routes, and earn reward points for improving civic road data.

[Live Demo](https://travo-75.vercel.app) | [Frontend](./Frontend) | [Backend](./Backend)

## Why Travo Wins

Road damage is often reported late, verified slowly, and ignored by navigation systems. Travo closes that loop with one connected workflow:

1. A citizen scans a hazard from the road.
2. AI detects the hazard type, confidence, risk level, and vehicle damage probability.
3. The report is saved with location, severity, image proof, and municipality routing.
4. Nearby drivers receive alerts and safer route recommendations.
5. The community verifies whether the hazard still exists.
6. Contributors earn rewards for helping cities maintain safer roads.

## Product Screenshots

<p align="center">
  <img src="./docs/screenshots/login.png" width="230" alt="Travo secure login screen" />
  <img src="./docs/screenshots/home.png" width="230" alt="Travo safety score dashboard" />
  <img src="./docs/screenshots/report.png" width="230" alt="AI scanned road hazard report form" />
</p>

<p align="center">
  <img src="./docs/screenshots/map.png" width="230" alt="Hazard marker and verification map" />
  <img src="./docs/screenshots/routes.png" width="230" alt="AI route options and ride comfort mode" />
  <img src="./docs/screenshots/alerts.png" width="230" alt="AI road intelligence alerts center" />
</p>

<p align="center">
  <img src="./docs/screenshots/profile.png" width="230" alt="Driver profile and reward points" />
  <img src="./docs/screenshots/navigation.png" width="230" alt="Live route tracking with traffic warnings" />
</p>

## Core Features

- AI hazard scanner for potholes, cracks, erosion, and dangerous road surfaces.
- Smart severity scoring with confidence, road safety score, risk level, and suggested action.
- Location-aware report creation with uploaded image proof and municipality assignment.
- Live map with hazard markers, crowd verification, and heatmap-ready backend data.
- AI Road Intelligence Center with safety, traffic, hazard, and municipality updates.
- Route comparison between fastest route and AI-optimized ride comfort route.
- Driver safety dashboard with safety score, route metrics, and recent activity.
- Rewards system that gives points for useful reports and safer civic participation.
- JWT authentication with protected reports, profile, and complaint workflows.
- Mobile-first UI designed for fast roadside use during real travel scenarios.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion |
| Maps | Leaflet, React Leaflet, Leaflet Heat |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| AI | Groq Vision, Hugging Face ViT fallback |
| Routing Data | OSRM, Open-Meteo, Nominatim |
| Auth and Uploads | JWT, bcryptjs, multer, ImgBB |

## System Architecture

```text
Mobile Web App
  -> Authenticated user actions
  -> AI hazard report upload
  -> Live route and map requests

Express API
  -> JWT auth middleware
  -> Report, complaint, map, auth, home routes
  -> AI detection pipeline
  -> Route scoring and alert synthesis

MongoDB
  -> Users
  -> Reports
  -> Complaints
  -> Alerts
  -> Routes

External Intelligence
  -> Groq Vision for road hazard analysis
  -> Hugging Face ViT fallback classification
  -> OSRM for route geometry
  -> Open-Meteo for weather risk
  -> Nominatim for location search
```

## AI Report Flow

```text
Capture road image
  -> Upload image
  -> Validate road context
  -> Detect hazard type
  -> Score severity and confidence
  -> Save geotagged report
  -> Award contributor points
  -> Create high-risk alerts
  -> Surface hazard on maps and routes
```

## Route Intelligence

Travo does more than draw a route. It evaluates active hazards, severity weights, crowd verification, night risk, weather conditions, traffic speed, and route geometry to produce:

- fastest route
- ride comfort route
- AI safety score
- comfort rating
- traffic level
- hazards encountered
- dynamic safety assistant message

This makes Travo useful not only for reporting problems, but also for preventing damage and improving trip decisions before the driver reaches a dangerous zone.

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd Travo
cd Backend && npm install
cd ../Frontend && npm install
```

### 2. Configure backend environment

Create `Backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMGBB_API_KEY=your_imgbb_key
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_TOKEN=your_huggingface_token
ORS_API_KEY=your_openrouteservice_key
```

### 3. Configure frontend environment

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the app

```bash
cd Backend
npm run dev
```

```bash
cd Frontend
npm run dev
```

Open the Vite URL shown in the terminal.

## API Highlights

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create a user account |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Fetch profile, rewards, and safety stats |
| `POST` | `/api/reports/detect` | Run AI road hazard detection |
| `POST` | `/api/reports/upload` | Upload report image |
| `POST` | `/api/reports/create` | Save a geotagged hazard report |
| `PUT` | `/api/reports/verify/:id` | Crowd-verify or resolve a hazard |
| `GET` | `/api/maps/markers` | Get active map hazards |
| `GET` | `/api/maps/alerts` | Get AI road intelligence alerts |
| `POST` | `/api/maps/routes` | Generate scored route options |

## Impact

Travo can help cities and drivers by:

- reducing surprise pothole damage and unsafe route choices
- building a live civic road-health dataset
- giving municipalities clearer, image-backed reports
- rewarding citizens for useful safety contributions
- improving traffic and hazard awareness in real time

## Future Scope

- Municipality dashboard for repair teams.
- Priority queues for high-risk and repeatedly verified hazards.
- Offline-first reporting for weak network zones.
- Insurance and fleet analytics for road damage exposure.
- Computer vision model fine-tuned on Indian road conditions.
- Automatic notifications when a reported hazard is repaired.

## Team

Built for a hackathon with a simple mission: make road safety smarter, faster, and community-powered.
