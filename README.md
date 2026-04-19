# Watch-Tracker-
Extended youtube clone to a better project ......... So check it out !!!

WatchTrack is a full-stack YouTube clone that goes beyond just watching videos. It tracks what you actually watch, saves real watch history (only when you watch >50%), and provides analytics on your viewing behavior. Built with vanilla JavaScript, Node.js, and YouTube API.

🚀 Features
🔍 Video Search — Search any video with real-time results

🎤 Voice Search — Search using voice commands (Web Speech API)

📊 Trending Feed — Fetches most popular videos from YouTube

📜 Smart Watch History — Saves video ONLY when watched >50% (no spam)

⏱️ Session Timer — Tracks total watch time per login session

👤 User Authentication — Signup/Login with encrypted passwords (JSON storage)

🎨 Dark Theme UI — Modern glass-morphism design with smooth animations

🔄 Infinite Scroll — Automatically loads more videos

📱 Fully Responsive — Works on mobile, tablet, and desktop

🧠 How It Works
The system uses a smart history logic to track real watch time:

Watch Percentage	Action
< 50% watched	❌ Not saved to history
≥ 50% watched	✅ Saved to history (once)
Video completed	✅ Already saved
No accidental clicks. No 2-second watches. Only real watch history.

Backend Architecture
text
User Login → Session Created → Watch Video → Progress Check Every 5s
                                                    ↓
                                            ≥50% Watched?
                                                    ↓
                                            Save to watchHistory.json
🛠️ Tech Stack
Category	Technologies
Frontend	HTML5, CSS3, JavaScript (ES6+)
Backend	Node.js, Express.js
API	YouTube Data API v3, YouTube IFrame API
Storage	JSON files (users.json, watchHistory.json)
Authentication	bcryptjs for password hashing
📁 Project Structure
text
youtrack/
│
├── backend/
│   ├── server.js              # REST APIs (6 endpoints)
│   ├── users.json             # User database (auto-created)
│   └── watchHistory.json      # Watch history (auto-created)
│
├── frontend/
│   ├── index.html             # Home page with video grid
│   ├── video.html             # Video player (YouTube IFrame)
│   ├── login_page.html        # Authentication page
│   │
│   ├── styles/
│   │   └── style.css          # Custom styles (Grid/Flexbox)
│   │
│   ├── scripts/
│   │   ├── script.js          # Main logic (API calls, search)
│   │   └── video.js           # Player logic (progress tracking)
│   │
│   └── icons/                 # SVG assets
│
└── images/                    # Logo, avatar, assets
▶️ How to Run
Prerequisites
Node.js (v14+)

YouTube API Key (free from Google Cloud Console)

Installation
bash
# 1. Clone the repository
git clone https://github.com/yourusername/youtrack.git
cd youtrack

# 2. Install backend dependencies
cd backend
npm install

# 3. Start the backend server
node server.js
# Server running on http://localhost:3000

# 4. Open frontend (Live Server or open index.html)
# Frontend running on http://localhost:5500
Environment Setup
Create backend/.env:

env
API_KEY=your_youtube_api_key_here
PORT=3000
📡 API Endpoints
Method	Endpoint	Description
POST	/api/signup	Create new user account
POST	/api/login	User login
POST	/api/watch-history	Save video to history
GET	/api/watch-history/:userId	Get user's watch history
PUT	/api/watch-progress	Update watch progress
GET	/api/analytics/:userId	Get user analytics



🔮 Future Improvements
⏰ Watch Later — Save videos to watch later

📺 Subscriptions Feed — Show videos from subscribed channels

👍 Video Likes/Dislikes — User interaction tracking

💬 Comment Section — Real-time comments

📦 Deployment — Host on Render + Netlify

🗄️ Database Migration — Move from JSON to MongoDB

🤝 Contributing
Feel free to fork this repository, open issues, or submit pull requests. Improvements are always welcome!


Video Demo (copy paste in new browser window)
https://github.com/user-attachments/assets/faf35def-c0c1-4d33-85a6-ea3b216dd32f




