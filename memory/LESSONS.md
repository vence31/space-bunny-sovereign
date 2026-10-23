# 💡 Lessons Learned & Operational Gotchas

- [YouTube TimedText]: YouTube requires signed player responses or youtube_transcript_api client emulation to retrieve captions.
- [CPU Context Window]: Feeding >20,000 characters to a 3B model on CPU causes memory thrashing; keep evidence dense and high-signal (5,000–12,000 chars).
- [Multi-turn Anaphora]: When user asks "What are the important facts of this video", session history must preserve previous URL context so DuckDuckGo doesn't run literal keyword search.
