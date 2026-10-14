# Run the apps locally

1. Start the backend (`keoshaa-be`) so it answers on `http://localhost:8000`.
2. Install and configure:

   ```bash
   nvm use
   npm install
   cp apps/web/.env.example apps/web/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   ```

3. Web: `npm run dev:web`, then open `http://localhost:3000`.
4. Mobile: `npm run dev:mobile`, then press `a` for the Android emulator or scan the QR code with Expo Go. On the Android emulator, set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000`.
5. Before pushing: `npm run verify`.
