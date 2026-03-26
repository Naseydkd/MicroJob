
  # Opportunity Connection Platform

  This is a code bundle for Opportunity Connection Platform. The original project is available at https://www.figma.com/design/5TYnRB55TI52extO0KbFvl/Opportunity-Connection-Platform.

  ## Running the code

  Run `npm i` to install the dependencies.

### Frontend

```bash
# from project root
npm run dev
```

The Vite dev server proxies `/missions` and `/applications` to a backend running at `http://localhost:4000`.

### Backend

The backend is a small Express app that forwards requests to Supabase. It lives in `backend/`.

```bash
cd backend
npm install
npm run dev   # starts on port 4000
```

Ensure you have a `.env` file with your Supabase credentials (see above).

### Available backend endpoints

The Express server exposes a few simple REST routes that wrap Supabase queries:

- `GET /missions` – list all missions
- `GET /missions/:id` – fetch a single mission
- `POST /applications` – submit a candidature (body should be a candidature object)
- `GET /notifications/:userId` – user notifications
- `GET /candidatures/jeune/:jeuneId` – candidatures submitted by a young user

Feel free to extend the server or consume these routes from the frontend.

## Backend (Supabase)

The frontend expects a Supabase project. Copy `.env.example` to `.env` and fill in your
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values from the Supabase dashboard.  
See `backend/SUPABASE_SETUP.md` for schema and usage details.
  