# 📋 Architectural Decisions Log

### 2026-10-21 — Copilot Local Model Routing
- Decision: Route prompts by task classification (3B for chat, 7B Coder for tools/code, 8B R1 for proofs).
- Reason: Avoids heavy 10GB CPU freezes and gives 1–2s sub-second responses.
- Alternatives rejected: Monolithic heavy model for all tasks.

### 2026-10-21 — Server-Sent Events (SSE) Streaming
- Decision: Implement true text/event-stream with immediate routing, status, and chunk emissions.
- Reason: Eliminates UI freezing and gives instant time-to-first-token.

### 2026-10-21 — Direct YouTube Transcript Extraction
- Decision: Use youtube_transcript_api in Python to pull full word-for-word spoken transcript.
- Reason: Raw HTML scraping on YouTube returns empty noscript tags without video transcript or full description.
