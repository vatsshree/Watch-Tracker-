const API_KEY = 'Your Youtube API Key';
const cardContainer = document.querySelector('.card');

// Save video data to localStorage before opening video page
function saveVideoData(videoId, title, channel, channelIcon, viewCount, publishedAt) {
  localStorage.setItem('currentVideo', JSON.stringify({
    id: videoId,
    title: title,
    channel: channel,
    channelIcon: channelIcon,
    viewCount: viewCount,
    publishedAt: publishedAt
  }));
}

// Fetch channel icon
async function fetchChannelIcon(channelId) {
  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${API_KEY}`);
    const data = await response.json();
    return data.items?.[0]?.snippet?.thumbnails?.default?.url || '';
  } catch (e) {
    console.error('Channel icon error:', e);
    return '';
  }
}

// Format view count
function formatViewCount(viewCount) {
  const count = parseInt(viewCount);
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + 'M';
  if (count >= 1_000) return (count / 1_000).toFixed(1) + 'K';
  return count.toString();
}

// Format published time
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: 'year', secs: 31536000 },
    { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 },
    { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 },
    { label: 'minute', secs: 60 },
  ];
  for (const i of intervals) {
    const val = Math.floor(seconds / i.secs);
    if (val >= 1) return `${val} ${i.label}${val > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

// Load trending videos with pagination
let nextPageToken = null;
let isLoading = false;

async function loadVideos(isNextPage = false) {
  if (isLoading) return;
  isLoading = true;

  try {
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=GB&maxResults=16&key=${API_KEY}`;
    if (isNextPage && nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    nextPageToken = data.nextPageToken || null;

    if (!isNextPage) cardContainer.innerHTML = '';

    for (const video of data.items) {
      const { title, thumbnails, channelTitle, publishedAt, channelId } = video.snippet;
      const videoId = video.id;
      const viewCount = video.statistics?.viewCount || 0;
      const channelIcon = await fetchChannelIcon(channelId);
      const formattedViews = formatViewCount(viewCount);
      const timeAgo = formatTimeAgo(publishedAt);

      const videoEl = document.createElement('div');
      videoEl.style.width = '450px';
      videoEl.style.margin = '10px';
      videoEl.innerHTML = `
        <a href="javascript:void(0)" onclick="saveVideoDataAndNavigate('${videoId}', '${title.replace(/'/g, "\\'")}', '${channelTitle.replace(/'/g, "\\'")}', '${channelIcon}', '${viewCount}', '${publishedAt}')" style="text-decoration: none; color: inherit; cursor: pointer;">
          <img src="${thumbnails.high?.url || thumbnails.medium?.url}" alt="${title}" style="width: 100%; border-radius: 10px;" />
          <div style="display: flex; margin-top: 10px;">
            <img src="${channelIcon}" alt="${channelTitle}" style="width: 36px; height: 36px; border-radius: 50%; margin-right: 10px;" />
            <div>
              <h3 style="font-size: 16px; margin: 0 0 5px 0; line-height: 1.2;">${title}</h3>
              <p style="margin: 0; font-size: 14px; color: gray;">${channelTitle}</p>
              <p style="margin: 0; font-size: 13px; color: gray;">${formattedViews} views • ${timeAgo}</p>
            </div>
          </div>
        </a>
      `;

      cardContainer.appendChild(videoEl);
    }
  } catch (error) {
    console.error('Failed to load videos:', error);
    if (!isNextPage) cardContainer.innerHTML = '<p>Unable to load videos.</p>';
  } finally {
    isLoading = false;
  }
}

// Global function for onclick to save data and navigate
window.saveVideoDataAndNavigate = function(videoId, title, channel, channelIcon, viewCount, publishedAt) {
  saveVideoData(videoId, title, channel, channelIcon, viewCount, publishedAt);
  window.open(`video.html?id=${videoId}`, '_blank');
};

// Search functionality
async function searchVideos(query) {
  try {
    cardContainer.innerHTML = '';

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    if (!videoIds) return;

    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`;
    const videoDetailsRes = await fetch(videoDetailsUrl);
    const videoData = await videoDetailsRes.json();

    for (const video of videoData.items) {
      const { title, thumbnails, channelTitle, publishedAt, channelId } = video.snippet;
      const videoId = video.id;
      const viewCount = video.statistics?.viewCount || 0;
      const channelIcon = await fetchChannelIcon(channelId);
      const formattedViews = formatViewCount(viewCount);
      const timeAgo = formatTimeAgo(publishedAt);

      const videoEl = document.createElement('div');
      videoEl.style.width = '450px';
      videoEl.style.margin = '10px';
      videoEl.innerHTML = `
        <a href="javascript:void(0)" onclick="saveVideoDataAndNavigate('${videoId}', '${title.replace(/'/g, "\\'")}', '${channelTitle.replace(/'/g, "\\'")}', '${channelIcon}', '${viewCount}', '${publishedAt}')" style="text-decoration: none; color: inherit; cursor: pointer;">
          <img src="${thumbnails.high?.url || thumbnails.medium?.url}" alt="${title}" style="width: 100%; border-radius: 10px;" />
          <div style="display: flex; margin-top: 10px;">
            <img src="${channelIcon}" alt="${channelTitle}" style="width: 36px; height: 36px; border-radius: 50%; margin-right: 10px;" />
            <div>
              <h3 style="font-size: 16px; margin: 0 0 5px 0; line-height: 1.2;">${title}</h3>
              <p style="margin: 0; font-size: 14px; color: gray;">${channelTitle}</p>
              <p style="margin: 0; font-size: 13px; color: gray;">${formattedViews} views • ${timeAgo}</p>
            </div>
          </div>
        </a>
      `;
      cardContainer.appendChild(videoEl);
    }
  } catch (err) {
    console.error('Search failed:', err);
    cardContainer.innerHTML = '<p>Search failed. Try again.</p>';
  }
}

// Infinite scroll event
window.addEventListener('scroll', () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
    nextPageToken &&
    !isLoading
  ) {
    loadVideos(true);
  }
});

// Run trending on load
window.onload = () => {
  nextPageToken = null;
  loadVideos();
};

// Search bar event listeners
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

if (searchInput && searchButton) {
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) searchVideos(query);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) searchVideos(query);
    }
  });
}

// Mic search functionality
const micBtn = document.getElementById('mic-btn');
if (micBtn && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';

  micBtn.addEventListener('click', () => {
    recognition.start();
  });

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = transcript;
      searchVideos(transcript);
    }
  };

  recognition.onerror = function(event) {
    console.error('Mic error:', event.error);
    alert('Microphone error: ' + event.error);
  };
}

// Tag click event for filtering videos
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', function() {
    const query = this.getAttribute('data-query');
    if (query && query !== 'All') {
      searchVideos(query);
    } else if (query === 'All') {
      nextPageToken = null;
      loadVideos();
    }
  });
});

// Theme Toggle Logic
const toggleBtn = document.getElementById("theme-toggle");
const icon = document.getElementById("theme-icon");
const body = document.body;

const moonIcon = `<path d="M21 12.79A9 9 0 0111.21 3c-.13 0-.26.01-.39.02a.75.75 0 00-.2 1.45A7.5 7.5 0 0012 21a7.48 7.48 0 007.53-6.39.75.75 0 00.47-.82z"/>`;

const sunIcon = `<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8zm10.48 0l1.8-1.79 1.41 1.41-1.79 1.8zM12 4V1h-1v3zm0 19v-3h-1v3zm8.66-11h3v-1h-3zm-19 0H0v1h3zM6.76 19.16l-1.8 1.79 1.41 1.41 1.8-1.79zm10.48 0l1.8 1.79 1.41-1.41-1.79-1.8zM12 6a6 6 0 100 12 6 6 0 000-12z"/>`;

function setTheme(isDark) {
  if (isDark) {
    body.classList.add("dark-theme");
    body.classList.remove("light-theme");
    icon.innerHTML = sunIcon;
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.add("light-theme");
    body.classList.remove("dark-theme");
    icon.innerHTML = moonIcon;
    localStorage.setItem("theme", "light");
  }
}

const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme === "dark");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isDark = body.classList.contains("dark-theme");
    setTheme(!isDark);
  });
}

// ---------------------------
// BACKEND INTEGRATION
// ---------------------------

const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Check if user is logged in (from localStorage)
function checkLoginStatus() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUIForLoggedInUser();
  }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
  const avatarImg = document.querySelector('img[alt="avatar"]');
  if (avatarImg && currentUser) {
    avatarImg.title = currentUser.name || currentUser.email;
  }
  
  // Load user's watch history
  loadWatchHistory();
  loadContinueWatching();
  loadRecentlyWatched();
  loadAnalytics();
}

// Save watch progress when video is played
async function saveWatchProgress(videoId, title, channelName, thumbnail, watchTime, duration, completed) {
  if (!currentUser) {
    console.log('No user logged in, skipping save');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/watch-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        videoId,
        title,
        thumbnail,
        channelName,
        watchTime,
        duration,
        completed
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Watch progress saved:', data);
    } else {
      console.error('❌ Failed to save:', response.status);
    }
  } catch (error) {
    console.error('❌ Error saving watch progress:', error);
  }
}

// Load user's watch history
async function loadWatchHistory() {
  if (!currentUser) {
    console.log('No user logged in');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/watch-history/${currentUser.id}`);
    if (response.ok) {
      const data = await response.json();
      console.log('📜 Watch history:', data.history);
      return data.history;
    }
  } catch (error) {
    console.error('Failed to load watch history:', error);
  }
}

// Load continue watching list
async function loadContinueWatching() {
  if (!currentUser) return;
  
  try {
    const response = await fetch(`${API_URL}/continue-watching/${currentUser.id}`);
    if (response.ok) {
      const data = await response.json();
      console.log('▶️ Continue watching:', data.continueWatching);
      return data.continueWatching;
    }
  } catch (error) {
    console.error('Failed to load continue watching:', error);
  }
}

// Load recently watched
async function loadRecentlyWatched() {
  if (!currentUser) return;
  
  try {
    const response = await fetch(`${API_URL}/recently-watched/${currentUser.id}?limit=10`);
    if (response.ok) {
      const data = await response.json();
      console.log('🕐 Recently watched:', data.recentlyWatched);
      return data.recentlyWatched;
    }
  } catch (error) {
    console.error('Failed to load recently watched:', error);
  }
}

// Load analytics
async function loadAnalytics() {
  if (!currentUser) return;
  
  try {
    const response = await fetch(`${API_URL}/analytics/${currentUser.id}`);
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Analytics:', data);
      return data;
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

// Call this when video is clicked
async function onVideoClick(videoId, title, channelName, thumbnail) {
  console.log("🎬 Video clicked, saving to history...");
  await saveWatchProgress(videoId, title, channelName, thumbnail, 0, 0, false);
  
  localStorage.setItem('currentVideo', JSON.stringify({
    id: videoId,
    title: title,
    channel: channelName,
    channelIcon: '',
    viewCount: '',
    publishedAt: ''
  }));
  
  window.open(`video.html?id=${videoId}`, '_blank');
}

// Check login status on page load
function checkUserStatus() {
  const currentUser = localStorage.getItem('currentUser');
  const userNameSpan = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  
  if (currentUser) {
    const user = JSON.parse(currentUser);
    if (userNameSpan) userNameSpan.textContent = user.name || user.email.split('@')[0];
    if (userAvatar && user.photoURL) userAvatar.src = user.photoURL;
  } else {
    if (userNameSpan) userNameSpan.textContent = 'Guest';
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login_page.html';
}

// Add logout event listener
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

// User Profile Click - Open Login Page
const userProfileBtn = document.getElementById('userProfileBtn');
if (userProfileBtn) {
  userProfileBtn.addEventListener('click', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      const wantsLogout = confirm(`Logged in as ${user.name || user.email}\n\nClick OK to logout`);
      if (wantsLogout) {
        localStorage.removeItem('currentUser');
        location.reload();
      }
    } else {
      window.location.href = 'login_page.html';
    }
  });
}

// Update avatar if user is logged in
function updateUserAvatar() {
  const currentUser = localStorage.getItem('currentUser');
  const userAvatar = document.getElementById('userAvatar');
  if (currentUser && userAvatar) {
    const user = JSON.parse(currentUser);
    userAvatar.title = user.name || user.email;
  }
}

// Run on page load
checkLoginStatus();
checkUserStatus();
updateUserAvatar();
