
# MockMate – AI-Powered Interview Analyzer

MockMate is a full-stack interview preparation platform that enables users to conduct live peer coding interviews and receive automated AI-based performance feedback.

## Features

- Real-time video interviews
- Real-time chat
- Shared coding environment
- Coding problem library
- Speech transcription
- Audio performance analysis
- Facial engagement detection
- Interview performance scoring
- Automated insights and recommendations

## How It Works

After an interview session, the recorded audio and video are processed by a Python ML service.

Whisper performs speech transcription, Librosa extracts audio features, and OpenCV analyzes facial engagement. These metrics are combined to generate an overall performance score and feedback.

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Monaco Editor

### Backend
- Node.js
- Express
- MongoDB

### ML
- Python
- Flask
- Whisper
- OpenCV
- PyTorch

### Communication
- Stream Video SDK
- Stream Chat SDK

## Future Scope

- LLM-based AI interviewer
- Multi-session performance tracking
- Code quality analysis
- System design whiteboard
- Mobile application
