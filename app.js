
const API_URL = "https://api.scryfall.com";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const results = document.getElementById("results");
const statusText = document.getElementById("status");

const collectionElement = document.getElementById("collection");
const cardCountElement = document.getElementById("cardCount");
const totalValueElement = document.getElementById("totalValue");

let collection = JSON.parse(
    localStorage.getItem("mtgCollection") || "[]"
);


// ===============================
// SEARCH
// ===============================

searchButton.addEventListener("click", searchCards);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchCards();
    }
});


async function searchCards() {

    const query = searchInput.value.trim();

    if (!query) {
        statusText.textContent = "Vul eerst een kaartnaam in.";
        return;
    }

    statusText.textContent = "Kaarten zoeken...";
    results.innerHTML = "";

    try {

        const response = await fetch(
            `${API_URL}/cards/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error("Scryfall request mislukt.");
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            statusText.textContent = "Geen kaarten gevonden.";
            return;
        }

        statusText.textContent =
            `${Math.min(data.data.length, 20)} resultaten gevonden.`;

        displayResults(data.data.slice(0, 20));

    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Er ging iets mis met het ophalen van de kaarten.";
    }
}


// ===============================
// DISPLAY SEARCH RESULTS
// ===============================

function displayResults(cards) {

    results.innerHTML = "";

    cards.forEach(card => {

        const image =
            card.image_uris?.normal ||
            card.card_faces?.[0]?.image_uris?.normal;

        if (!image) {
            return;
        }

        const element = document.createElement("div");

        element.className = "card";

        element.innerHTML = `
            <img src="${image}" alt="${escapeHtml(card.name)}">

            <h3>${escapeHtml(card.name)}</h3>

            <p>
                ${escapeHtml(card.set_name || "Onbekende set")}
            </p>

            <p>
                ${escapeHtml(card.collector_number || "")}
            </p>

            <button>
                Toevoegen
            </button>
        `;

        element
            .querySelector("button")
            .addEventListener("click", () => {
                addCard(card);
            });

        results.appendChild(element);
    });
}


// ===============================
// ADD CARD
// ===============================

function addCard(card) {

    const existing = collection.find(
        item => item.scryfall_id === card.id
    );

    if (existing) {

        existing.amount += 1;

    } else {

        collection.push({
            scryfall_id: card.id,
            name: card.name,
            amount: 1,
            value: getPrice(card)
        });

    }

    saveCollection();
    renderCollection();
}


// ===============================
// PRICE
// ===============================

function getPrice(card) {

    if (!card.prices) {
        return 0;
    }

    const eur =
        parseFloat(card.prices.eur) ||
        0;

    return eur;
}


// ===============================
// COLLECTION
// ===============================

function renderCollection() {

    collectionElement.innerHTML = "";

    let totalCards = 0;
    let totalValue = 0;

    collection.forEach((item, index) => {

        totalCards += item.amount;

        totalValue +=
            item.value * item.amount;

        const element =
            document.createElement("div");

        element.className =
            "collection-item";

        element.innerHTML = `
            <img
                src="https://cards.scryfall.io/normal/front/${item.scryfall_id[0]}/${item.scryfall_id[1]}/${item.scryfall_id}.jpg"
                alt="${escapeHtml(item.name)}"
            >

            <div class="collection-info">
                <strong>
                    ${escapeHtml(item.name)}
                </strong>

                <span>
                    €${item.value.toFixed(2)} per kaart
                </span>
            </div>

            <div class="quantity">

                <button class="minus">
                    −
                </button>

                <strong>
                    ${item.amount}
                </strong>

                <button class="plus">
                    +
                </button>

            </div>
        `;

        element
            .querySelector(".minus")
            .addEventListener("click", () => {
                changeAmount(index, -1);
            });

        element
            .querySelector(".plus")
            .addEventListener("click", () => {
                changeAmount(index, 1);
            });

        collectionElement.appendChild(element);
    });

    cardCountElement.textContent =
        totalCards.toLocaleString("nl-NL");

    totalValueElement.textContent =
        totalValue.toFixed(2);
}


// ===============================
// CHANGE AMOUNT
// ===============================

function changeAmount(index, change) {

    collection[index].amount += change;

    if (collection[index].amount <= 0) {
        collection.splice(index, 1);
    }

    saveCollection();
    renderCollection();
}


// ===============================
// SAVE
// ===============================

function saveCollection() {

    localStorage.setItem(
        "mtgCollection",
        JSON.stringify(collection)
    );
}


// ===============================
// BASIC HTML ESCAPE
// ===============================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// Initial render

renderCollection();

