const state = {
  allShows: [],
  selectedShowId: null,
  allEpisodes: [],
  searchTerm: "",
  selectedEpisodeId: "",
  urlCache: new Map(),
  viewMode: "shows", // Tracks "shows" or "episodes" view
};
async function setup() {
  const searchInput = document.getElementById("search-input");
  const showSelect = document.getElementById("show-select");
  const episodeSelect = document.getElementById("episode-select");
  const backBtn = document.getElementById("back-to-shows-btn");

  // Requirement 3: Return to shows listing
  backBtn.addEventListener("click", () => {
    state.viewMode = "shows";
    state.searchTerm = "";
    state.selectedEpisodeId = ""; // Reset episode selection
    searchInput.value = "";
    render();
  });

  // Requirement 4: Show/Episode search
  searchInput.addEventListener("input", (e) => {
    state.searchTerm = e.target.value;
    render();
  });

  // Requirement 5: Episode Selector functionality
  episodeSelect.addEventListener("change", (e) => {
    state.selectedEpisodeId = e.target.value;
    render();
  });

  // Show Selector: Quick jump between shows
  showSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      loadEpisodesForShow(Number(e.target.value));
    }
  });

  try {
    const shows = await fetchAllShows();
    state.allShows = shows;
    populateShowSelect(showSelect, shows);
    render();
  } catch (error) {
    renderError("Could not load shows.");
  }
}

async function fetchAllShows() {
  const shows = await fetchJson("https://api.tvmaze.com/shows");
  return [...shows].sort((showA, showB) =>
    showA.name.localeCompare(showB.name, undefined, { sensitivity: "base" }),
  );
}

async function loadEpisodesForShow(showId) {
  state.viewMode = "episodes";
  state.selectedShowId = showId;
  state.searchTerm = ""; // Reset search when switching

  try {
    // Requirement 6: fetchJson handles the cache check automatically
    const episodes = await fetchJson(
      `https://api.tvmaze.com/shows/${showId}/episodes`,
    );
    state.allEpisodes = episodes;
    populateEpisodeSelect(document.getElementById("episode-select"));
    render();
  } catch (error) {
    renderError("Could not load episodes.");
  }
}

function render() {
  const root = document.getElementById("root");
  const isShowsMode = state.viewMode === "shows";
  const backBtn = document.getElementById("back-to-shows-btn");
  const episodeControls = document.querySelectorAll(".episode-control");

  // Requirement 2b & 3: Toggle UI visibility
  backBtn.style.display = isShowsMode ? "none" : "inline-block";
  episodeControls.forEach((el) => {
    el.style.display = isShowsMode ? "none" : "inline-block";
  });

  if (isShowsMode) {
    const filteredShows = filterShows(state.searchTerm);
    renderShowListing(filteredShows);
  } else {
    const filteredEpisodes = filterEpisodes(
      state.searchTerm,
      state.selectedEpisodeId,
    );
    makePageForEpisodes(filteredEpisodes);
  }
}
function filterEpisodes(searchTerm, selectedEpisodeId) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  return state.allEpisodes.filter((episode) => {
    const episodeName = episode.name.toLowerCase();
    const episodeSummary = (episode.summary || "").toLowerCase();
    const matchesSearch =
      normalizedTerm === "" ||
      episodeName.includes(normalizedTerm) ||
      episodeSummary.includes(normalizedTerm);
    const matchesEpisode =
      selectedEpisodeId === "" || `${episode.id}` === selectedEpisodeId;

    return matchesSearch && matchesEpisode;
  });
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  const template = document.getElementById("episode-template");
  const countDisplay = document.getElementById("episode-count");

  rootElem.innerHTML = "";
  countDisplay.innerText = `Displaying ${episodeList.length}/${state.allEpisodes.length} episode(s)`;

  episodeList.forEach((episode) => {
    const clone = template.content.cloneNode(true);
    const title = clone.querySelector(".episode-title");
    const img = clone.querySelector("img");
    const summary = clone.querySelector(".episode-summary");

    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    title.textContent = `${episode.name} - ${episodeCode}`;
    img.src = episode.image?.medium || "";
    img.alt = episode.name;
    summary.innerHTML = episode.summary || "";

    rootElem.appendChild(clone);
  });
}

function populateShowSelect(selectElement, shows) {
  selectElement.innerHTML = "";

  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    selectElement.appendChild(option);
  });
}

function populateEpisodeSelect(selectElement) {
  selectElement.innerHTML = "";

  const allEpisodesOption = document.createElement("option");
  allEpisodesOption.value = "";
  allEpisodesOption.textContent = "All Episodes";
  selectElement.appendChild(allEpisodesOption);

  state.allEpisodes.forEach((episode) => {
    const option = document.createElement("option");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    option.value = episode.id;
    option.textContent = `${episodeCode} - ${episode.name}`;
    selectElement.appendChild(option);
  });
}

async function fetchJson(url) {
  if (state.urlCache.has(url)) {
    return state.urlCache.get(url);
  }

  const pendingRequest = fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  });

  state.urlCache.set(url, pendingRequest);
  try {
    return await pendingRequest;
  } catch (error) {
    state.urlCache.delete(url);
    throw error;
  }
}

function renderError(message) {
  const rootElem = document.getElementById("root");
  const countDisplay = document.getElementById("episode-count");
  rootElem.innerHTML = "";
  countDisplay.innerText = message;
}

// creating and formatting episode code.
function formatEpisodeCode(season, number) {
  const s = String(season).padStart(2, "0");
  const e = String(number).padStart(2, "0");
  return `S${s}E${e}`;
}

function filterShows(query) {
  const term = query.toLowerCase();
  return state.allShows.filter((show) => {
    return (
      show.name.toLowerCase().includes(term) ||
      show.genres.some((g) => g.toLowerCase().includes(term)) ||
      (show.summary || "").toLowerCase().includes(term)
    );
  });
}

function renderShowListing(shows) {
  const root = document.getElementById("root");
  const template = document.getElementById("show-template");
  root.innerHTML = "";

  shows.forEach((show) => {
    const clone = template.content.cloneNode(true);

    // Requirement 2: Show name must be clickable
    const title = clone.querySelector(".show-name");
    title.textContent = show.name;
    title.style.cursor = "pointer";

    // Use an arrow function to ensure show.id is captured
    title.addEventListener("click", () => {
      loadEpisodesForShow(show.id);
    });

    // Metadata mapping
    clone.querySelector(".show-image").src = show.image?.medium || "";
    clone.querySelector(".show-summary").innerHTML = show.summary || "";
    clone.querySelector(".show-genres").textContent = show.genres.join(", ");
    clone.querySelector(".show-status").textContent = show.status;
    clone.querySelector(".show-rating").textContent =
      show.rating.average || "N/A";
    clone.querySelector(".show-runtime").textContent = show.runtime;

    root.appendChild(clone);
  });
}

window.onload = setup;
