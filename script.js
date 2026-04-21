//You can edit ALL of the code here
const state = {
  allEpisodes: [],
  filteredEpisodes: [],
  searchTerm: "",
  selectedEpisode: null,
};

function setup() {
  const allEpisodes = getAllEpisodes();
  state.allEpisodes = allEpisodes;
  state.filteredEpisodes = allEpisodes;

  const searchInput = document.getElementById("search-input");
  searchInput.value = "";
  searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    state.filteredEpisodes = filterEpisodes(state.searchTerm);

    makePageForEpisodes(state.filteredEpisodes);
  });

  const episodeSelect = document.getElementById("episode-select");
  episodeSelect.value = "";
  populateEpisodeSelect(episodeSelect);
  episodeSelect.addEventListener("change", (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === "") {
      state.selectedEpisode = null;
      state.filteredEpisodes = state.allEpisodes;
    } else {
      state.selectedEpisode = state.allEpisodes.find(
        (ep) => `${ep.id}` === selectedValue,
      );
      state.filteredEpisodes = state.selectedEpisode
        ? [state.selectedEpisode]
        : [];
    }
    makePageForEpisodes(state.filteredEpisodes);
  });

  makePageForEpisodes(state.filteredEpisodes);
}

function filterEpisodes(searchTerm) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (normalizedTerm === "") {
    return state.allEpisodes;
  }

  return state.allEpisodes.filter((episode) => {
    const episodeName = episode.name.toLowerCase();
    const episodeSummary = (episode.summary || "").toLowerCase();

    return (
      episodeName.includes(normalizedTerm) ||
      episodeSummary.includes(normalizedTerm)
    );
  });
}

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  const template = document.getElementById("episode-template");
  const countDisplay = document.getElementById("episode-count");

  rootElem.innerHTML = ""; // clear the container

  countDisplay.innerText = `Displaying ${episodeList.length}/${state.allEpisodes.length} episode(s)`;

  episodeList.forEach((episode) => {
    // clone the template structure
    const clone = template.content.cloneNode(true);

    // select the specific parts of the clone to update
    const title = clone.querySelector(".episode-title");
    const img = clone.querySelector("img");
    const summary = clone.querySelector(".episode-summary");

    // populate with data
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    title.textContent = `${episode.name} - ${episodeCode}`;
    img.src = episode.image.medium;
    img.alt = episode.name;
    summary.innerHTML = episode.summary;

    // add the finished clone to the page
    rootElem.appendChild(clone);
  });
}

function populateEpisodeSelect(selectElement) {
  state.allEpisodes.forEach((episode) => {
    const option = document.createElement("option");
    const episodeCode = formatEpisodeCode(episode.season, episode.number);
    option.value = episode.id;
    option.textContent = `${episodeCode} - ${episode.name}`;
    selectElement.appendChild(option);
  });
}

// creating and formatting episode code.
function formatEpisodeCode(season, number) {
  const s = String(season).padStart(2, "0");
  const e = String(number).padStart(2, "0");
  return `S${s}E${e}`;
}

window.onload = setup;
