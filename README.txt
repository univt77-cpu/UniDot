# UniDot 1.3 Web

A local web interface for UniDot using Flask and llama.cpp/Qwen.

## Run

1. Install Python dependency:

   python -m pip install -r requirements.txt

2. Start the website:

   python unidot_web.py

3. Your browser should open automatically at:

   http://127.0.0.1:5000

UniDot 1.3 automatically starts the local llama.cpp server and Qwen 2.5 1.5B model.

The llama.cpp executable path is configured for the Windows installation used during development. If your installation is in another folder, change `LLAMA_SERVER` in `unidot_web.py`.

## Features

- Browser chat UI
- Local Qwen AI
- Conversation memory
- Persistent memory
- Autocorrect
- Definitions
- Calculator
- Teaching
- Memory controls
- System status
- Automatic local AI startup
