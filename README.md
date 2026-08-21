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
- Performance scoring
- Automated insights and recommendations

## How It Works

After an interview session, the recorded audio and video are processed by a Python ML service.

Whisper performs speech transcription and OpenCV analyzes facial engagement. These metrics are combined to generate performance scores and recommendations.

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
- Clerk
- Inngest

### ML
- Python
- Flask
- Whisper
- Librosa
- OpenCV
- PyTorch

### Communication
- Stream Video SDK
- Stream Chat SDK

## Results

The system successfully provides automated interview analysis through:

- Speech transcription
- Speaking pace analysis
- Vocal energy analysis
- Silence ratio
- Pitch variation
- Facial engagement detection
- Weighted overall performance scoring
- Personalized recommendations

The project report does not specify a single numerical accuracy percentage; therefore, the results are reported using these performance metrics rather than an invented accuracy value. :contentReference[oaicite:1]{index=1}

## Future Scope

- LLM-based AI interviewer
- Multi-session performance tracking
- Code quality analysis
- System design whiteboard
- Mobile application
