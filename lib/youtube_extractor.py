#!/usr/bin/env python3
import sys
import json
import re
import urllib.request
import io

# Force UTF-8 encoding on Windows standard streams to prevent charmap UnicodeEncodeErrors
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

def extract_video_id(url_or_id):
    if not url_or_id:
        return None
    url_or_id = url_or_id.strip()
    # Match youtu.be/<id>
    m1 = re.search(r'youtu\.be/([a-zA-Z0-9_-]{11})', url_or_id)
    if m1:
        return m1.group(1)
    # Match watch?v=<id>
    m2 = re.search(r'[?&]v=([a-zA-Z0-9_-]{11})', url_or_id)
    if m2:
        return m2.group(1)
    # Match shorts/<id> or embed/<id>
    m3 = re.search(r'/(?:shorts|embed)/([a-zA-Z0-9_-]{11})', url_or_id)
    if m3:
        return m3.group(1)
    # Direct 11 char ID
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
    return None

def get_video_info_and_transcript(video_id):
    result = {
        "success": False,
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "title": None,
        "author": None,
        "description": "",
        "transcript": "",
        "snippet_count": 0,
        "error": None
    }

    # 1. Fetch metadata via YouTube HTML
    watch_url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        req = urllib.request.Request(
            watch_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
        )
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        
        m_title = re.search(r'<title>(.+?)</title>', html)
        if m_title:
            result["title"] = m_title.group(1).replace(" - YouTube", "").strip()

        # Extract ytInitialPlayerResponse JSON
        m_json = re.search(r'ytInitialPlayerResponse\s*=\s*({.+?});', html)
        if m_json:
            try:
                data = json.loads(m_json.group(1))
                vdetails = data.get("videoDetails", {})
                if vdetails.get("title"):
                    result["title"] = vdetails.get("title")
                if vdetails.get("author"):
                    result["author"] = vdetails.get("author")
                if vdetails.get("shortDescription"):
                    result["description"] = vdetails.get("shortDescription")
            except Exception:
                pass
    except Exception as e:
        result["metadata_warning"] = str(e)

    # 2. Fetch full transcript via youtube_transcript_api
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        fetched = api.fetch(video_id)
        snippets = fetched.snippets
        
        texts = [s.text.strip() for s in snippets if s.text and s.text.strip()]
        full_text = " ".join(texts)
        
        # Clean common artifacts
        full_text = re.sub(r'\s+', ' ', full_text)
        result["transcript"] = full_text
        result["snippet_count"] = len(snippets)
        result["success"] = True
    except Exception as e:
        result["transcript_error"] = str(e)
        # If we at least got the title/description, consider it partial success
        if result["title"] or result["description"]:
            result["success"] = True

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No URL or video ID provided"}))
        sys.exit(1)
        
    raw_input = sys.argv[1]
    vid = extract_video_id(raw_input)
    if not vid:
        print(json.dumps({"error": f"Could not parse valid YouTube video ID from '{raw_input}'"}))
        sys.exit(1)
        
    data = get_video_info_and_transcript(vid)
    print(json.dumps(data, ensure_ascii=True))
