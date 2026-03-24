const API_KEY = "AIzaSyCvmHIShdjnT4QMgb0djX1aGMKn-MOUgHg";

let player;
let isPlaying = false;
let queue = [];
let currentIndex = 0;
let progressInterval;
let loadingTimeout;
let showingVideo = false;

// FAVORITES
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// INIT PLAYER
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player-container-visible', {
    height: '250',
    width: '250',
    events: {
      onStateChange: onPlayerStateChange
    }
  });
}

// ENTER KEY + SEEK BAR
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") search();
  });

  document.getElementById("progressBar").addEventListener("input", (e) => {
    if (!player || !player.getDuration) return;
    const duration = player.getDuration();
    player.seekTo((e.target.value / 100) * duration, true);
  });
});

// SEARCH
async function search() {
  const query = document.getElementById("searchInput").value;
  if (!query) return;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<p>🔎 Searching...</p>";

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    queue = data.items.filter(item => item.id?.videoId);
    displayResults(queue);

  } catch {
    resultsDiv.innerHTML = "<p>Error loading results</p>";
  }
}

// DISPLAY RESULTS
function displayResults(items) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  items.forEach((item, index) => {
    const thumb = item.snippet.thumbnails.medium.url;
    const isFav = favorites.some(f => f.id.videoId === item.id.videoId);

    const div = document.createElement("div");
    div.className = "result";

    div.innerHTML = `
      <img src="${thumb}">
      <div style="flex:1">
        <strong>${item.snippet.title}</strong><br>
        ${item.snippet.channelTitle}
      </div>
      <button onclick="toggleFavorite(event, ${index})">
        ${isFav ? "❤️" : "🤍"}
      </button>
    `;

    div.onclick = () => playSong(index);

    resultsDiv.appendChild(div);
  });
}

// FAVORITES TOGGLE
function toggleFavorite(event, index) {
  event.stopPropagation();

  const song = queue[index];
  const exists = favorites.find(f => f.id.videoId === song.id.videoId);

  if (exists) {
    favorites = favorites.filter(f => f.id.videoId !== song.id.videoId);
  } else {
    favorites.push(song);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  displayResults(queue);
}

// SHOW FAVORITES
function showFavorites() {
  queue = [...favorites];
  displayResults(queue);
}

// PLAY SONG
function playSong(index) {
  const song = queue[index];
  if (!song) return;

  currentIndex = index;

  document.getElementById("title").innerText = "Loading...";
  document.getElementById("channel").innerText = "";

  // COVER
  const thumb = song.snippet.thumbnails;
  document.getElementById("cover").src =
    thumb.maxres?.url ||
    thumb.high?.url ||
    thumb.medium?.url ||
    thumb.default?.url;

  player.loadVideoById(song.id.videoId);

  isPlaying = true;
  updatePlayButton();

  // fallback if ad delays playback
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    document.getElementById("title").innerText = song.snippet.title;
    document.getElementById("channel").innerText = "(starting...)";
  }, 4000);
}

// PLAYER STATE
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    clearTimeout(loadingTimeout);

    const song = queue[currentIndex];

    document.getElementById("title").innerText = song.snippet.title;
    document.getElementById("channel").innerText = song.snippet.channelTitle;

    startProgressUpdater();
  }

  if (event.data === YT.PlayerState.ENDED) {
    next();
  }
}

// TOGGLE VIDEO (for ads)
function toggleVideo() {
  const cover = document.getElementById("cover");
  const video = document.getElementById("videoWrapper");
  const btn = document.getElementById("toggleBtn");

  showingVideo = !showingVideo;

  if (showingVideo) {
    cover.style.display = "none";
    video.style.display = "block";
    btn.innerText = "🖼 Switch to Cover";
  } else {
    cover.style.display = "block";
    video.style.display = "none";
    btn.innerText = "🎥 Switch to Video";
  }
}

// CONTROLS
function togglePlay() {
  if (!player) return;

  if (isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }

  isPlaying = !isPlaying;
  updatePlayButton();
}

function next() {
  if (currentIndex < queue.length - 1) {
    playSong(currentIndex + 1);
  }
}

function prev() {
  if (currentIndex > 0) {
    playSong(currentIndex - 1);
  }
}

function updatePlayButton() {
  document.getElementById("playBtn").innerText = isPlaying ? "⏸" : "▶";
}

// PROGRESS
function startProgressUpdater() {
  clearInterval(progressInterval);

  progressInterval = setInterval(() => {
    if (!player || !player.getCurrentTime) return;

    const current = player.getCurrentTime();
    const duration = player.getDuration();

    if (!duration) return;

    const percent = (current / duration) * 100;

    document.getElementById("progressBar").value = percent;
    document.getElementById("currentTime").innerText = formatTime(current);
    document.getElementById("duration").innerText = formatTime(duration);
  }, 500);
}

function formatTime(time) {
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
