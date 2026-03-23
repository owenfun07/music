const API_KEY = "AIzaSyBpYAPbRLBhpeZLHXEgUVdCanRxcw7jy9c";

async function search() {
  const query = document.getElementById("searchInput").value;

  if (!query) return;

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    displayResults(data.items);
  } catch (err) {
    console.error(err);
    alert("Error fetching results");
  }
}

function displayResults(items) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  items.forEach(item => {
    const videoId = item.id.videoId;

    const div = document.createElement("div");
    div.className = "song";

    div.innerHTML = `
      <h3>${item.snippet.title}</h3>
      <p>${item.snippet.channelTitle}</p>
      <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" 
        allowfullscreen>
      </iframe>
    `;

    resultsDiv.appendChild(div);
  });
}
