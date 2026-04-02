
// JSDocs Stuff
/**
 * Fetches data from PokéAPI, prioritizing the local browser cache.
 * Caches responses for 30 days to strictly comply with Fair Use.
 * 
 * @param {string} url - The PokéAPI endpoint (e.g., 'https://pokeapi.co/api/v2/pokemon/pikachu')
 * @returns {Promise<object>} The JSON data
 */



// Variables
const PkmInput = document.getElementById("PkmInput");
const PkmImg = document.getElementById("PkmImg");
const PkmName = document.getElementById("PkmName");
const PkmType = document.getElementById("PkmType");
const PkmEvos = document.getElementById("PkmEvos");
const PkmHeight = document.getElementById("PkmHeight");
const PkmWeight = document.getElementById("PkmWeight");
const PkmAbility = document.getElementById("PkmAbility");
const CurrentTb = document.getElementById("CurrentTb");


//Functions

function toTitleCase(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractEvoNames(chain) {
  const EvoTree = [];
  let current = chain;

  while (current && current.species) {
    EvoTree.push(current.species.name);
    current = current.evolves_to[0] ?? null;
  }

  return EvoTree;
}

// Async Functions

async function pokeApiFetch(url) {
  const CACHE_NAME = "pokeapi-cache";
  const timeKey = `time_${url}`;
  const ThirtyDayInMS = 30 * 24 * 60 * 60 * 1000;
  const lastFetched = localStorage.getItem(timeKey);
  const now = Date.now();
  const isExpired = !lastFetched || (now - lastFetched) > ThirtyDayInMS;
  const cache = await caches.open(CACHE_NAME);

  if (!isExpired) {
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      console.log(`[CACHE ACCESSED] --- Serving ${url} from local cache.`);
      return cachedResponse.json();
    }
  }

  console.log(`[CACHE EMPTY OR FAILED TO OPEN] --- Fetching ${url} from PokéAPI...`);

  try {
    const response = await fetch(url);

    if(!response.ok) {
      if (response.status === 404) {
        console.warn(`Pokemon not found at ${url}`);
        return null;
      }
    throw new Error(`PokeAPI returned --- ${response.status}`) 
    }
  
  await cache.put(url, response.clone());
  localStorage.setItem(timeKey, now);

  return response.json();

  } catch (error) {
    console.error("Network Issue or PokeAPI down --- ", error);
    throw error;
  }
}



async function RenderSearchHandle() {
  const input = PkmInput.value.toLowerCase().trim();
  if (!input) return;

  PkmName.textContent = "Loading...";

  const data = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon/${input}`);
  if (!data) {
    PkmName.textContent = "Not Found";
    return;
  }

  const speciesURL = data.species.url
  const speciesData = await pokeApiFetch(speciesURL);

  const evoChainURL = speciesData.evolution_chain.url;
  const evoData = await pokeApiFetch(evoChainURL);

  // const displayString = ev.map(name => toTitleCase(name)).join(' -> ');

  // Rendering Data

  PkmName.textContent = toTitleCase(data.name)

  PkmHeight.textContent = (data.height / 10) + " m";
  PkmWeight.textContent = (data.weight / 10) + " kg";

  const typesList = data.types.map(t => toTitleCase(t.type.name)).join(', ');

  PkmType.textContent =  typesList;

  const evoNames = extractEvoNames(evoData.chain).join(" -> ");
  PkmEvos.textContent = evoNames;

  const abilitiesList = data.abilities.map(a => toTitleCase(a.ability.name)).join(', ');
  PkmAbility.textContent = abilitiesList;

  const Img = document.getElementById('PkmImg');
  if (data.sprites && data.sprites.other.showdown.front_default) {
    Img.src = data.sprites.other.showdown.front_default;
  } else {
    Img.style.display = 'none';
  }
}


// Event Listeners



document.getElementById('PkmInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') RenderSearchHandle();
});