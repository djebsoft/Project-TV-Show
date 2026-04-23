const state = {
  allShows: [],
  selectedShowId: null,
  allEpisodes: [],
  filteredEpisodes: [],
  searchTerm: "",
  selectedEpisodeId: "",
  urlCache: new Map(),
};
async function setup() {
  const searchInput = document.getElementById("search-input");
  const episodeSelect = document.getElementById("episode-select");
  const showSelect = document.getElementById("show-select");

  searchInput.value = "";
  episodeSelect.value = "";

  searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applyFiltersAndRender();
  });

  episodeSelect.addEventListener("change", (event) => {
    state.selectedEpisodeId = event.target.value;
    applyFiltersAndRender();
  });

  showSelect.addEventListener("change", async (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === "") {
      return;
    }

    await loadEpisodesForShow(Number(selectedValue));
  });

  try {
    const shows = await fetchAllShows();
    state.allShows = shows;
    populateShowSelect(showSelect, shows);

    if (shows.length > 0) {
      showSelect.value = String(shows[0].id);
      await loadEpisodesForShow(shows[0].id);
    } else {
      makePageForEpisodes([]);
    }
  } catch (error) {
    renderError("Could not load shows. Please try again later.");
    // Keep in console for debugging while leaving a friendly UI message.
    console.error(error);
  }
}

async function fetchAllShows() {
  const shows = await fetchJson("https://api.tvmaze.com/shows");
  return [...shows].sort((showA, showB) =>
    showA.name.localeCompare(showB.name, undefined, { sensitivity: "base" }),
  );
}

async function loadEpisodesForShow(showId) {
  state.selectedShowId = showId;
  state.selectedEpisodeId = "";

  const countDisplay = document.getElementById("episode-count");
  countDisplay.innerText = "Loading episodes...";

  try {
    const episodes = await fetchJson(
      `https://api.tvmaze.com/shows/${showId}/episodes`,
    );
    state.allEpisodes = episodes;
    populateEpisodeSelect(document.getElementById("episode-select"));
    applyFiltersAndRender();
  } catch (error) {
    renderError("Could not load episodes for this show.");
    console.error(error);
  }
}

function applyFiltersAndRender() {
  state.filteredEpisodes = filterEpisodes(
    state.searchTerm,
    state.selectedEpisodeId,
  );
  makePageForEpisodes(state.filteredEpisodes);
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

window.onload = setup;
