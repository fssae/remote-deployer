# Remote Deployer - Project Status

## Backend (Golang)
- **Status**: Completed
- **Location**: `backend/`
- **Configuration**: Edit `backend/config.yaml` to set your target server details.
- **Run**: `cd backend && go run main.go`

## Frontend (Vue3)
- **Status**: Completed
- **Location**: `frontend/`
- **Configuration**: Edit `frontend/src/config.js` to point to your backend IP.
- **Run Web**: `cd frontend && pnpm run dev`
- **Build Mobile**: 
    1. `pnpm build`
    2. `npx cap sync`
    3. `npx cap open android`

## Mobile App
- **Status**: Configured with Capacitor
- **Platform**: Android added.
- **Note**: Ensure your phone handles the WebSocket connection to your computer's IP correctly.

All tasks from the initial plan are finished.
