const API_KEY = "AIzaSyBpYAPbRLBhpeZLHXEgUVdCanRxcw7jy9c";

let player;
let currentVideoId = null;
let isPlaying = false;
let queue = [];
let currentIndex = 0;
let progressInterval;

// Load YouTube Player
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player-container', {
    height: '0',
    width: '0',
    videoId: '',
    events: {
      onStateChange: onPlayerStateChange
    }
  });
}

// SEARCH
async function search() {
  const query = document.getElementById("searchInput").value;
  if (!query) return;

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      document.getElementById("results").innerHTML = "<p>No results found</p>";
      return;
    }

    // keep only valid videos
    queue = data.items.filter(item => item.id?.videoId);

    displayResults(queue);

  } catch (err) {
    console.error(err);
    alert("Error fetching results");
  }
}

// DISPLAY RESULTS
function displayResults(items) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "result";

    div.innerHTML = `
      <strong>${item.snippet.title}</strong><br>
      ${item.snippet.channelTitle}
    `;

    div.onclick = () => playSong(index);

    resultsDiv.appendChild(div);
  });
}

// PLAY SONG
function playSong(index) {
  const song = queue[index];
  if (!song || !song.id.videoId) return;

  currentIndex = index;
  currentVideoId = song.id.videoId;

  player.loadVideoById(currentVideoId);

  document.getElementById("title").innerText = song.snippet.title;
  document.getElementById("channel").innerText = song.snippet.channelTitle;

  // COVER IMAGE
  const thumb = song.snippet.thumbnails;
  document.getElementById("cover").src =
    thumb.maxres?.url ||
    thumb.high?.url ||
    thumb.medium?.url ||
    thumb.default?.url;

  isPlaying = true;
  updatePlayButton();
  startProgressUpdater();
}

// PLAY / PAUSE
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

// NEXT / PREV
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

// UPDATE BUTTON
function updatePlayButton() {
  document.getElementById("playBtn").innerText = isPlaying ? "⏸" : "▶";
}

// AUTO NEXT
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    next();
  }
}

// PROGRESS BAR LOOP
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

// FORMAT TIME
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// SEEK BAR CONTROL
document.addEventListener("DOMContentLoaded", () => {
  const progressBar = document.getElementById("progressBar");

  progressBar.addEventListener("input", (e) => {
    if (!player || !player.getDuration) return;

    const duration = player.getDuration();
    const seekTo = (e.target.value / 100) * duration;

    player.seekTo(seekTo, true);
  });
});
