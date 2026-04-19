const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Data file paths
const USERS_FILE = path.join(__dirname, "users.json");
const WATCH_HISTORY_FILE = path.join(__dirname, "watchHistory.json");

// ---------------------------
// Helper Functions
// ---------------------------

// Read users from JSON file
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

// Write users to JSON file
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Read watch history from JSON file
function readWatchHistory() {
  if (!fs.existsSync(WATCH_HISTORY_FILE)) {
    fs.writeFileSync(WATCH_HISTORY_FILE, JSON.stringify({}));
  }
  const data = fs.readFileSync(WATCH_HISTORY_FILE);
  return JSON.parse(data);
}

// Write watch history to JSON file
function writeWatchHistory(history) {
  fs.writeFileSync(WATCH_HISTORY_FILE, JSON.stringify(history, null, 2));
}

// ---------------------------
// 1. USER AUTHENTICATION APIs
// ---------------------------

// Signup API
app.post("/api/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const users = readUsers();
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    email,
    name: name || email.split("@")[0],
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ 
    success: true, 
    message: "Signup successful", 
    user: userWithoutPassword 
  });
});

// Login API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const users = readUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid password" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ 
    success: true, 
    message: "Login successful", 
    user: userWithoutPassword 
  });
});

// Get user by ID
app.get("/api/user/:userId", (req, res) => {
  const { userId } = req.params;
  const users = readUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// ---------------------------
// 2. WATCH HISTORY APIs
// ---------------------------

// Save watch history (called when video is clicked)
app.post("/api/watch-history", (req, res) => {
  console.log("📥 Received watch history request:", req.body);
  const { userId, videoId, title, thumbnail, channelName, watchTime, duration, completed } = req.body;

  if (!userId || !videoId) {
    return res.status(400).json({ error: "userId and videoId required" });
  }

  const watchHistory = readWatchHistory();
  
  if (!watchHistory[userId]) {
    watchHistory[userId] = [];
  }

  const existingIndex = watchHistory[userId].findIndex(v => v.videoId === videoId);

  const watchEntry = {
    videoId,
    title: title || "Untitled",
    thumbnail: thumbnail || "",
    channelName: channelName || "Unknown Channel",
    lastWatchedAt: new Date().toISOString(),
    watchTime: watchTime || 0,
    duration: duration || 0,
    completed: completed || false,
    watchCount: 1
  };

  if (existingIndex !== -1) {
    watchHistory[userId][existingIndex].lastWatchedAt = watchEntry.lastWatchedAt;
    watchHistory[userId][existingIndex].watchTime = watchEntry.watchTime;
    watchHistory[userId][existingIndex].completed = watchEntry.completed;
    watchHistory[userId][existingIndex].watchCount += 1;
    console.log("✅ Updated existing entry");
  } else {
    watchHistory[userId].push(watchEntry);
    console.log("🆕 Created new entry");
  }

  writeWatchHistory(watchHistory);
  res.json({ success: true, message: "Watch history saved" });
});

// Get user's watch history
app.get("/api/watch-history/:userId", (req, res) => {
  const { userId } = req.params;
  const watchHistory = readWatchHistory();
  
  const userHistory = watchHistory[userId] || [];
  userHistory.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));
  
  res.json({ history: userHistory });
});

// Update watch progress (for continue watching) - CREATES if not exists
app.put("/api/watch-progress", (req, res) => {
  const { userId, videoId, watchTime } = req.body;
  
  console.log("📥 Received watch progress:", { userId, videoId, watchTime });

  if (!userId || !videoId) {
    return res.status(400).json({ error: "userId and videoId required" });
  }

  const watchHistory = readWatchHistory();
  
  if (!watchHistory[userId]) {
    watchHistory[userId] = [];
  }
  
  const videoIndex = watchHistory[userId].findIndex(v => v.videoId === videoId);
  
  if (videoIndex !== -1) {
    watchHistory[userId][videoIndex].watchTime = watchTime;
    watchHistory[userId][videoIndex].lastWatchedAt = new Date().toISOString();
    console.log("✅ Updated existing entry");
  } else {
    console.log("🆕 Creating new watch entry for video:", videoId);
    watchHistory[userId].push({
      videoId: videoId,
      title: "Loading...",
      thumbnail: "",
      channelName: "Loading...",
      lastWatchedAt: new Date().toISOString(),
      watchTime: watchTime,
      duration: 0,
      completed: false,
      watchCount: 1
    });
  }
  
  writeWatchHistory(watchHistory);
  res.json({ success: true });
});

// ---------------------------
// 3. CONTINUE WATCHING API
// ---------------------------

app.get("/api/continue-watching/:userId", (req, res) => {
  const { userId } = req.params;
  const watchHistory = readWatchHistory();
  
  const userHistory = watchHistory[userId] || [];
  
  const continueWatching = userHistory.filter(v => 
    !v.completed && v.watchTime > 0 && v.watchTime < (v.duration || 999999)
  );
  
  continueWatching.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));
  
  res.json({ continueWatching });
});

// ---------------------------
// 4. RECENTLY WATCHED API
// ---------------------------

app.get("/api/recently-watched/:userId", (req, res) => {
  const { userId } = req.params;
  const { limit = 10 } = req.query;
  const watchHistory = readWatchHistory();
  
  const userHistory = watchHistory[userId] || [];
  
  const recentlyWatched = userHistory
    .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt))
    .slice(0, parseInt(limit));
  
  res.json({ recentlyWatched });
});

// ---------------------------
// 5. ANALYTICS API
// ---------------------------

app.get("/api/analytics/:userId", (req, res) => {
  const { userId } = req.params;
  const watchHistory = readWatchHistory();
  
  const userHistory = watchHistory[userId] || [];
  
  if (userHistory.length === 0) {
    return res.json({
      totalVideosWatched: 0,
      totalWatchTime: 0,
      completedVideos: 0,
      mostWatchedChannel: null,
      completionRate: 0,
      watchByHour: {}
    });
  }

  const totalVideosWatched = userHistory.length;
  const totalWatchTime = userHistory.reduce((sum, v) => sum + (v.watchTime || 0), 0);
  const completedVideos = userHistory.filter(v => v.completed).length;
  
  const channelCount = {};
  userHistory.forEach(v => {
    const channel = v.channelName;
    channelCount[channel] = (channelCount[channel] || 0) + v.watchCount;
  });
  
  let mostWatchedChannel = null;
  let maxCount = 0;
  for (const [channel, count] of Object.entries(channelCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostWatchedChannel = channel;
    }
  }
  
  const watchByHour = {};
  userHistory.forEach(v => {
    const hour = new Date(v.lastWatchedAt).getHours();
    watchByHour[hour] = (watchByHour[hour] || 0) + 1;
  });

  res.json({
    totalVideosWatched,
    totalWatchTime: Math.floor(totalWatchTime / 60),
    completedVideos,
    mostWatchedChannel,
    completionRate: userHistory.length > 0 ? ((completedVideos / userHistory.length) * 100).toFixed(1) : 0,
    watchByHour
  });
});

// Test connection endpoint
app.post("/api/test-connection", (req, res) => {
  console.log("✅ Test connection received:", req.body);
  res.json({ success: true, message: "Backend is reachable!" });
});

// ---------------------------
// Start Server
// ---------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Users file: ${USERS_FILE}`);
  console.log(`📁 Watch history file: ${WATCH_HISTORY_FILE}`);
});