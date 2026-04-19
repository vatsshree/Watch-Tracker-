// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let player;
let historySaved = false;
let watchStartTime = null;

// Get video ID from URL
const urlParams = new URLSearchParams(window.location.search);
const finalVideoId = urlParams.get('id');

// Get video data from localStorage
const videoData = JSON.parse(localStorage.getItem('currentVideo') || '{}');

// Set video info in page
const videoTitleElement = document.getElementById('video-title');
const channelNameElement = document.getElementById('channel-name');
const channelIconElement = document.getElementById('channel-icon');

if (videoTitleElement) videoTitleElement.textContent = videoData.title || 'Untitled';
if (channelNameElement) channelNameElement.textContent = videoData.channel || 'Unknown Channel';
if (channelIconElement && videoData.channelIcon) channelIconElement.src = videoData.channelIcon;

// Save to history (fire and forget)
function saveToHistory() {
  if (historySaved) return;
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id || !videoData.id) return;
  
  // Get watch time from player
  let watchTime = 0;
  if (player && player.getCurrentTime) {
    watchTime = player.getCurrentTime();
  }
  
  const data = {
    userId: currentUser.id,
    videoId: videoData.id,
    title: videoData.title || "Untitled",
    thumbnail: videoData.thumbnail || "",
    channelName: videoData.channel || "Unknown Channel",
    watchTime: Math.floor(watchTime),
    duration: 0,
    completed: false
  };
  
  // Fire and forget - no response handling
  fetch('http://localhost:3000/api/watch-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  historySaved = true;
  console.log(`✅ Saved "${videoData.title}" (${Math.floor(watchTime)}s watched)`);
}

// YouTube Player API
function onYouTubeIframeAPIReady() {
  player = new YT.Player('youtube-player', {
    height: '500',
    width: '100%',
    videoId: finalVideoId,
    playerVars: {
      'autoplay': 1,
      'controls': 1,
      'rel': 0,
      'modestbranding': 1,
      'fs': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onError': onPlayerError
    }
  });
}

function onPlayerReady(event) {
  console.log('✅ Player ready');
  event.target.playVideo();
}

function onPlayerError(event) {
  console.error('Player error:', event.data);
}

// ONLY save when page is being unloaded (close, refresh, back button)
window.addEventListener('beforeunload', () => {
  if (player && !historySaved) {
    saveToHistory();
  }
});

console.log("✅ video.js loaded - saves history only when leaving page");