const API_KEY = "AIzaSyBpYAPbRLBhpeZLHXEgUVdCanRxcw7jy9c";

let player;
let currentVideoId = null;
let isPlaying = false;
let queue = [];
let currentIndex = 0;

// Load YouTube Player
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player-container', {
    height: '0',
    width: '0',
    videoId: '',
    events: {
      onReady: () => {},
      onStateChange: onPlayerStateChange
    }
  });
}

// Search songs
async function search() {
  const query = document.getElementById("searchInput").value;

  if (!query) return;

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("API Response:", data);

    if (!data.items || data.items.length === 0) {
      document.getElementById("results").innerHTML = "<p>No results found</p>";
      return;
    }

    // Only keep valid videos
    queue = data.items.filter(item => item.id && item.id.videoId);

    displayResults(queue);

  } catch (err) {
    console.error(err);
    alert("Error fetching results");
  }
}

// Show results
function displayResults(items) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (!items || items.length === 0) {
    resultsDiv.innerHTML = "<p>No playable results</p>";
    return;
  }

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

// Play selected song
function playSong(index) {
  const song = queue[index];

  if (!song || !song.id.videoId) return;

  currentIndex = index;
  currentVideoId = song.id.videoId;

  player.loadVideoById(currentVideoId);

  document.getElementById("title").innerText = song.snippet.title;
  document.getElementById("channel").innerText = song.snippet.channelTitle;

  isPlaying = true;
  updatePlayButton();
}

// Play / Pause
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

// Next / Prev
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

// Sync button UI
function updatePlayButton() {
  document.getElementById("playBtn").innerText = isPlaying ? "⏸" : "▶";
}

// Detect end of song
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    next();
  }
}
