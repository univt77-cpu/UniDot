import os
import json
import urllib.request
import urllib.error

from flask import Flask, request, jsonify

app = Flask(__name__)

# ============================================================
# UniDot Cloud AI Server
# Local development version
# ============================================================

HOST = os.environ.get("UNIDOT_AI_HOST", "0.0.0.0")
PORT = int(os.environ.get("UNIDOT_AI_PORT", "8090"))

LLAMA_URL = os.environ.get(
    "UNIDOT_LLAMA_URL",
    "http://127.0.0.1:8080"
).rstrip("/")

MODEL_NAME = os.environ.get(
    "UNIDOT_AI_MODEL",
    "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M"
)


def llama_chat(messages, temperature=0.7, max_tokens=512):
    """Send a chat request to the local llama.cpp server."""

    url = LLAMA_URL + "/v1/chat/completions"

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False
    }

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))

        choices = result.get("choices", [])

        if not choices:
            return "The AI returned no response."

        message = choices[0].get("message", {})
        answer = message.get("content", "")

        return answer.strip()

    except urllib.error.URLError as e:
        return f"AI server connection error: {e}"

    except Exception as e:
        return f"AI server error: {e}"


@app.get("/")
def home():
    return jsonify({
        "name": "UniDot Cloud AI Server",
        "status": "running",
        "model": MODEL_NAME
    })


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_NAME,
        "llama_server": LLAMA_URL
    })


@app.get("/v1/models")
def models():
    return jsonify({
        "object": "list",
        "data": [
            {
                "id": MODEL_NAME,
                "object": "model",
                "owned_by": "unidot"
            }
        ]
    })


@app.post("/v1/chat/completions")
def chat_completions():
    try:
        body = request.get_json(force=True)

        messages = body.get("messages", [])

        if not messages:
            return jsonify({
                "error": "messages is required"
            }), 400

        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("max_tokens", 512)

        answer = llama_chat(
            messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return jsonify({
            "id": "unidot-chat",
            "object": "chat.completion",
            "model": MODEL_NAME,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": answer
                    },
                    "finish_reason": "stop"
                }
            ]
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    print("=" * 60)
    print("UniDot Cloud AI Server")
    print("=" * 60)
    print(f"AI server: http://{HOST}:{PORT}")
    print(f"llama.cpp: {LLAMA_URL}")
    print(f"Model:     {MODEL_NAME}")
    print("=" * 60)

    app.run(
        host=HOST,
        port=PORT,
        debug=False,
        threaded=True
    )