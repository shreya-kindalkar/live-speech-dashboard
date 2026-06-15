# VoiceSpace

VoiceSpace is a React app for authenticated users to access a live speech-to-text dashboard. It combines Nhost authentication with Deepgram WebSocket streaming for real-time transcription.

## Features

- Authentication using Nhost with email/password
- Persistent session across refreshes
- Protected dashboard for signed-in users only
- Live speech-to-text capture using Deepgram Nova-2 via WebSocket
- Interim transcription updates displayed as you speak

## Tech Stack

- React
- Vite
- `@nhost/react`
- Deepgram WebSocket API

## Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create a `.env` file in `frontend` with the following variables:

```env
VITE_NHOST_SUBDOMAIN=your-nhost-subdomain
VITE_NHOST_REGION=your-nhost-region
VITE_DEEPGRAM_API_KEY=your-deepgram-api-key
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app in your browser using the local URL shown by Vite.

## Notes

- The dashboard is protected and requires a valid Nhost session.
- Deepgram streaming uses WebSocket for low-latency interim transcription.
