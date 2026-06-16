# Video Chat

**Live Demo:** https://raghuram07.github.io/

A real-time, peer-to-peer video chat application built with React, Node.js, WebRTC (via simple-peer), and Socket.io. Users can make 1-on-1 video calls and exchange text messages using a shared Peer ID — no accounts or sign-up required.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [How It Works](#how-it-works)
  - [Signaling Flow](#signaling-flow)
  - [WebRTC Connection Flow](#webrtc-connection-flow)
  - [Messaging Flow](#messaging-flow)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running Locally](#running-locally)
  - [Production Build](#production-build)
- [Deployment](#deployment)
- [Component Reference](#component-reference)
- [Socket.io Events](#socketio-events)
- [Known Limitations](#known-limitations)

---

## Features

- 1-on-1 peer-to-peer video and audio calling
- Real-time text chat alongside an active call
- Shareable Peer ID for initiating calls (no accounts needed)
- Incoming call notification with caller name display
- Copy-to-clipboard for your Peer ID
- Responsive Material-UI interface

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 17, Material-UI v4, JavaScript/TypeScript |
| Real-time signaling | Socket.io v4 (client + server) |
| P2P media | simple-peer (WebRTC wrapper) |
| Backend | Node.js, Express |
| Build tool | Create React App (react-scripts v4) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client A)                        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌───────────┐  │
│  │VideoPlayer│  │ Sidebar  │  │ Notifications │  │ Messages  │  │
│  └──────────┘  └──────────┘  └───────────────┘  └───────────┘  │
│                        │                                          │
│              ┌──────────────────┐                                │
│              │   Context.js     │  ← WebRTC logic & global state │
│              │  (SocketContext) │                                 │
│              └────────┬─────────┘                                │
│                       │ Socket.io client                         │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │  WebSocket  (signaling only — no media)
                        │
            ┌───────────▼────────────┐
            │    Signaling Server    │
            │   Node.js + Express    │
            │     + Socket.io        │
            │                        │
            │  Events relayed:       │
            │  • me                  │
            │  • callUser            │
            │  • answerCall          │
            │  • callAccepted        │
            │  • callEnded           │
            │  • newMessage          │
            │  • receiveMessage      │
            └───────────┬────────────┘
                        │
                        │  WebSocket  (signaling only — no media)
                        │
┌───────────────────────┼──────────────────────────────────────────┐
│              ┌────────▼─────────┐                                │
│              │   Context.js     │                                │
│              │  (SocketContext) │                                │
│              └──────────────────┘                                │
│                                                                   │
│                        Browser (Client B)                         │
└─────────────────────────────────────────────────────────────────┘

                    ↕  After signaling completes  ↕

        ┌──────────────┐                   ┌──────────────┐
        │   Client A   │◄── WebRTC P2P ───►│   Client B   │
        │              │  audio + video     │              │
        └──────────────┘                   └──────────────┘
```

The signaling server is only a relay — it never touches audio or video data. Once the WebRTC handshake is complete, all media flows directly between the two browsers.

---

## How It Works

### Signaling Flow

```
Client A                   Signaling Server                  Client B
   │                              │                               │
   │──── connect ────────────────►│◄──── connect ───────────────│
   │◄─── emit("me", socketId) ───│──── emit("me", socketId) ───►│
   │                              │                               │
   │  [A copies their ID and      │                               │
   │   shares it with B out-of-   │                               │
   │   band — URL, message, etc.] │                               │
   │                              │                               │
   │──── emit("callUser") ───────►│──── emit("callUser") ───────►│
   │  { userToCall, signalData,   │  { from, name, signal }      │
   │    from, name }              │                               │
   │                              │        [B sees incoming call] │
   │                              │◄─── emit("answerCall") ─────│
   │                              │        { signal, to }         │
   │◄─── emit("callAccepted") ───│                               │
   │          { signal }          │                               │
   │                              │                               │
   │◄══════ WebRTC P2P media stream established ════════════════►│
```

### WebRTC Connection Flow

1. **Media access** — On page load the browser requests camera and microphone via `getUserMedia`. The stream is stored in React state and attached to the local `<video>` element.

2. **Socket connection** — The client connects to the signaling server. The server immediately emits a `me` event containing a unique socket ID that acts as the user's Peer ID.

3. **Caller initiates** — The caller types the recipient's Peer ID, optionally sets a display name, and clicks **Call**. A `simple-peer` instance is created with `initiator: true`. simple-peer generates an SDP offer (surfaced via its `signal` event), which is forwarded to the server via `callUser`.

4. **Recipient receives** — The server relays the offer to the recipient. The `Notifications` component renders an incoming call card showing the caller's name.

5. **Recipient answers** — Clicking **Answer** creates a `simple-peer` instance with `initiator: false`, signals it with the received SDP offer, and sends the generated SDP answer back through the server via `answerCall`.

6. **Handshake complete** — The server delivers the answer to the caller via `callAccepted`. The caller's peer is signalled with it, completing the ICE negotiation.

7. **Media streams live** — Both peers' `stream` events fire, attaching the remote stream to the `<video>` element in `VideoPlayer`. Audio and video now flow directly P2P.

8. **Hangup** — Either party clicks **Hang Up**. The peer connection is destroyed (`connectionRef.current.destroy()`) and the page reloads to reset state. The server broadcasts `callEnded` on disconnect so the other party is also notified.

### Messaging Flow

```
Client A               Signaling Server              All Other Clients
   │                         │                               │
   │── emit("newMessage") ──►│── broadcast("receiveMessage")►│
   │   { sender, message,    │                               │
   │     time }              │                               │
```

Text messages travel through the signaling server and are broadcast to every other connected client (not scoped to the active call pair).

---

## Project Structure

```
Video-chat-main/
└── video-chat/
    ├── index.js              # Express + Socket.io signaling server
    ├── package.json          # Server dependencies & npm scripts
    ├── Procfile              # Deployment process declaration (Heroku-style)
    └── client/
        ├── package.json      # React client dependencies & npm scripts
        ├── tsconfig.json     # TypeScript configuration
        ├── public/
        │   └── index.html    # HTML shell
        └── src/
            ├── index.js      # React DOM entry point
            ├── App.js        # Root component; composes all views
            ├── Context.js    # WebRTC peer logic, socket events, global state
            ├── config.js     # SOCKET_URL — change this per environment
            ├── styles.css    # Global styles
            ├── components/
            │   ├── VideoPlayer.jsx     # Local + remote <video> elements
            │   ├── Sidebar.jsx         # ID display, name input, call controls
            │   ├── Notifications.jsx   # Incoming call banner with Answer button
            │   └── Messages.jsx        # Real-time text chat panel
            └── Models/
                └── Types.ts  # TypeScript interface for the Message object
```

### Key File Responsibilities

| File | What it does |
|---|---|
| `index.js` (server) | Listens for socket connections; relays `callUser`, `answerCall`, `callAccepted`, `callEnded`, and `newMessage` events between clients. Never handles media. |
| `Context.js` | Owns all WebRTC and socket state. Exposes `callUser`, `answerCall`, `leaveCall`, and `sendMessage` via React Context to every component in the tree. |
| `VideoPlayer.jsx` | Renders two `<video>` elements — local stream (muted autoplay) and the remote peer's stream. |
| `Sidebar.jsx` | Lets the user set their display name, copy their socket ID, enter a peer ID to call, and initiate or end a call. |
| `Notifications.jsx` | Shows an incoming call card with the caller's name and an **Answer** button when `call.isReceivingCall` is true. |
| `Messages.jsx` | Text chat panel: displays received messages and sends new ones via `sendMessage` from context. |
| `config.js` | Single source of truth for the signaling server URL. Update this for each deployment environment. |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm (bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Video-chat-main/video-chat

# 2. Install server dependencies
npm install

# 3. Install client dependencies
cd client
npm install
```

### Configuration

Open [video-chat/client/src/config.js](video-chat/client/src/config.js) and set the `SOCKET_URL` to match your environment:

```js
// For local development
const config = {
  SOCKET_URL: 'http://localhost:5000/',
};

// For production — replace with your deployed server URL
// const config = {
//   SOCKET_URL: 'https://your-server.up.railway.app/',
// };

export default config;
```

### Running Locally

You need two terminal windows running simultaneously.

**Terminal 1 — start the signaling server**

```bash
cd video-chat
npm run dev        # auto-reloads on file changes (uses nodemon)
# or
npm start          # one-shot start, no auto-reload
```

The server starts on `http://localhost:5000`.

**Terminal 2 — start the React client**

```bash
cd video-chat/client
npm start
```

The client starts on `http://localhost:3000` and opens in your browser automatically.

**Testing a call locally**

1. Open `http://localhost:3000` in your browser — this is **User A**.
2. Open the same URL in a **private/incognito window** — this is **User B** (each session needs its own socket connection).
3. On User A's screen, click **Copy Your ID**.
4. On User B's screen, paste User A's ID into the **ID to call** field and click **Call**.
5. On User A's screen, click **Answer** when the incoming call notification appears.

### Production Build

```bash
cd video-chat/client
npm run build
```

Generates an optimized static bundle in `video-chat/client/build/`. Serve this directory from any static hosting provider or with the included `serve` package:

```bash
npx serve video-chat/client/build
```

---

## Deployment

### Server (Node.js)

| Platform | Notes |
|---|---|
| **Railway** | Connect your repo; Railway auto-detects `package.json`. Set `PORT` if needed. |
| **Heroku** | `Procfile` is already present (`web: node index.js`). Push and deploy normally. |
| **AWS Elastic Beanstalk** | Set environment variable `PORT`; Beanstalk assigns the port automatically. |
| **Render / Fly.io** | Set the start command to `node index.js` in the platform dashboard. |

**Environment variable:**

```
PORT=5000    # optional; the server defaults to 5000 if not set
```

### Client (React)

After running `npm run build`, deploy the `build/` folder to any static host.

| Platform | How |
|---|---|
| **GitHub Pages** | Live at https://raghuram07.github.io/ — add `gh-pages` package; set `"homepage"` in `package.json`; run `npm run deploy`. |
| **Vercel / Netlify** | Connect your repo; set build command to `npm run build` and publish directory to `client/build`. |
| **Railway (static)** | Add a static site service pointing to the `client/` directory. |

After deploying the server, update `SOCKET_URL` in `config.js` to your live server URL and rebuild/redeploy the client.

---

## Component Reference

### `ContextProvider` / `SocketContext`

Wraps the entire app. Provides the following values via `useContext(SocketContext)`:

| Value | Type | Description |
|---|---|---|
| `me` | `string` | This client's socket ID (shown as the Peer ID) |
| `stream` | `MediaStream` | Local camera and microphone stream |
| `call` | `object` | Incoming call details: `{ isReceivingCall, from, name, signal }` |
| `callAccepted` | `boolean` | Whether an active call is in progress |
| `callEnded` | `boolean` | Whether the most recent call has ended |
| `myVideo` | `ref` | Ref for the local `<video>` element |
| `userVideo` | `ref` | Ref for the remote `<video>` element |
| `name` | `string` | This user's display name |
| `setName` | `function` | Setter for the display name |
| `callUser(id)` | `function` | Start a call to the peer with the given socket ID |
| `answerCall()` | `function` | Accept the current incoming call |
| `leaveCall()` | `function` | End the active call and reset state |
| `sendMessage(msg)` | `function` | Broadcast a chat message to all connected clients |

---

## Socket.io Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `me` | Server → Client | `socketId: string` | Assigns the client a unique ID on connect |
| `callUser` | Client → Server | `{ userToCall, signalData, from, name }` | Sends a call offer to a specific peer |
| `callUser` | Server → Client | `{ signal, from, name }` | Delivers an incoming call to the recipient |
| `answerCall` | Client → Server | `{ signal, to }` | Sends the callee's SDP answer back to the caller |
| `callAccepted` | Server → Client | `signal` | Delivers the answer signal to the caller |
| `callEnded` | Server → Client | — | Broadcast when any peer disconnects |
| `newMessage` | Client → Server | `{ sender, message, time }` | Submits a chat message |
| `receiveMessage` | Server → Client | `{ sender, message, time }` | Delivers a chat message to all other clients |

---

## Known Limitations

- **1-on-1 only** — The signaling design supports exactly two peers per call. Group calls are not supported.
- **No authentication** — Any client that knows another client's socket ID can initiate a call.
- **Messages are global** — Chat messages are broadcast to all connected clients, not scoped to the active call pair.
- **Page reload on hangup** — `leaveCall` reloads the page to reset state. Any unsaved data is lost.
- **Default STUN only** — simple-peer uses Google's public STUN servers by default. Calls may fail across symmetric NAT without a TURN server.
- **No persistence** — All session data is in-memory and ephemeral. There is no database.
