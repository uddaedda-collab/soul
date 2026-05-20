# Sync Engine

Playback correction strategy:

1. Client sends an event with current position and local timestamp.
2. Server applies the event, updates authoritative playback state, and records the server time.
3. Server broadcasts the new state with a version number.
4. Clients compare local status against expected projected position.
5. If drift exceeds 500 ms, clients hard seek.
6. If drift is between 180 ms and 500 ms while playing, clients briefly nudge rate for soft correction.

Rules:

- Host-controlled rooms reject non-host control events.
- Shared mode accepts control events from either participant.
- Presence updates should be driven by Socket.IO disconnects plus Firebase presence if you wire it in production.
