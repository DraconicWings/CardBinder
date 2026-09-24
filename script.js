const MASTER_CARDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSw7uMK-pIYU0n_l8ypDgW2GrgLgnQIO5_j6phxej4IetUEDbzizT-xr4X1nV2TPQEYF2fVT2JBdpjJ/pub?gid=0&single=true&output=csv&t=" + Date.now();
const USER_INVENTORY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSw7uMK-pIYU0n_l8ypDgW2GrgLgnQIO5_j6phxej4IetUEDbzizT-xr4X1nV2TPQEYF2fvT2JBdpjJ/pub?gid=923512728&single=true&output=csv" + Date.now();

let masterCards = [];
let userInventory = [];
let currentDisplayCards = [];
let currentPage = 1;
const CARDS_PER_PAGE = 18;

function initBinder() {
  if (typeof Papa === 'undefined') {
    console.error("PapaParse library missing!");
    return;
  }

  Papa.parse(MASTER_CARDS_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (masterResults) => {
      masterCards = masterResults.data.map(row => {
        const cleanRow = {};
        for (let key in row) cleanRow[key.trim().toLowerCase()] = row[key] ? row[key].trim() : "";
        
        return {
          Card_ID: cleanRow['card_id'] || cleanRow['id'] || "",
          Card_Name: cleanRow['card_name'] || cleanRow['name'] || "Unknown Card",
          Artwork_URL: cleanRow['artwork_url'] || cleanRow['image'] || cleanRow['url'] || "",
          Back_Artwork_URL: cleanRow['back_artwork_url'] || cleanRow['back_artwork'] || cleanRow['back_url'] || "https://i.imgur.com/83pZ2eM.png",
          Variant_Type: cleanRow['variant_type'] || cleanRow['variant'] || cleanRow['rarity'] || "normal"
        };
      }).filter(card => card.Card_ID !== "" || card.Artwork_URL !== "");

      Papa.parse(USER_INVENTORY_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (inventoryResults) => {
          userInventory = inventoryResults.data.map(row => {
            const cleanRow = {};
            for (let key in row) cleanRow[key.trim().toLowerCase()] = row[key] ? row[key].trim() : "";
            return {
              Twitch_Username: cleanRow['twitch_username'] || cleanRow['username'] || "",
              Card_ID: cleanRow['card_id'] || cleanRow['id'] || "",
              Count: cleanRow['count'] || cleanRow['quantity'] || "0"
            };
          });

          filterUserBinder();
        }
      });
    }
  });
}

function filterUserBinder() {
  const usernameInput = document.getElementById("usernameInput") ? document.getElementById("usernameInput").value.trim().toLowerCase() : "";
  const variantSelect = document.getElementById("variantSelect");
  const selectedVariant = variantSelect ? variantSelect.value.trim().toLowerCase() : "";

  const processedCards = masterCards.map(card => {
    let count = 0;
    if (usernameInput !== "") {
      const ownedItem = userInventory.find(inv => 
        inv.Twitch_Username.toLowerCase() === usernameInput && 
        inv.Card_ID.toLowerCase() === card.Card_ID.toLowerCase()
      );
      count = ownedItem ? parseInt(ownedItem.Count || 0) : 0;
    }

    return { ...card, count: count };
  });

  currentDisplayCards = processedCards.filter(card => {
    if (selectedVariant === "" || selectedVariant === "all") return true;
    const cardVariant = (card.Variant_Type || "normal").toLowerCase();
    
    // Fuzzy matching for rarities in CSV
    if (selectedVariant === "foil") {
      return cardVariant.includes("foil") || cardVariant.includes("super") || cardVariant.includes("ultra") || cardVariant.includes("secret") || cardVariant.includes("rare");
    }
    return cardVariant.includes(selectedVariant);
  });

  currentPage = 1;
  renderPages();
}

function renderPages() {
  const leftPage = document.getElementById("leftPage");
  const rightPage = document.getElementById("rightPage");
  if (!leftPage || !rightPage) return;

  leftPage.innerHTML = "";
  rightPage.innerHTML = "";

  const totalPages = Math.ceil(currentDisplayCards.length / CARDS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const pageCards = currentDisplayCards.slice(startIndex, startIndex + CARDS_PER_PAGE);

  pageCards.forEach((card, index) => {
    const slot = document.createElement("div");
    const usernameInput = document.getElementById("usernameInput") ? document.getElementById("usernameInput").value.trim() : "";
    
    // Greyscale if username provided & unowned, or if default unowned state
    const isOwned = usernameInput !== "" ? card.count > 0 : false;
    
    slot.className = `card-slot ${isOwned ? 'owned' : 'unobtained'}`;
    
    slot.innerHTML = `
      <img src="${card.Artwork_URL}" alt="${card.Card_Name}">
      ${card.count > 1 ? `<span class="dup-badge">x${card.count}</span>` : ''}
      <div class="card-footer">${card.Card_Name}</div>
    `;

    slot.onclick = () => openModal(card);

    if (index < 9) leftPage.appendChild(slot);
    else rightPage.appendChild(slot);
  });

  if (document.getElementById("pageIndicator")) {
    document.getElementById("pageIndicator").innerText = `Page ${currentPage} of ${totalPages}`;
  }
  if (document.getElementById("prevBtn")) {
    document.getElementById("prevBtn").disabled = currentPage === 1;
  }
  if (document.getElementById("nextBtn")) {
    document.getElementById("nextBtn").disabled = currentPage >= totalPages;
  }
}

function filterVariant() {
  filterUserBinder();
}

function changePage(direction) {
  currentPage += direction;
  renderPages();
}

// 3D Modal Setup
const modalOverlay = document.getElementById("modalOverlay");
const card3D = document.getElementById("card3D");
const modalCardImg = document.getElementById("modalCardImg");
const modalCardBackImg = document.getElementById("modalCardBackImg");

function openModal(card) {
  if (!modalOverlay || !card3D || !modalCardImg) return;
  const variant = (card.Variant_Type || 'normal').toLowerCase();
  
  modalCardImg.src = card.Artwork_URL;
  if (modalCardBackImg) {
    modalCardBackImg.src = card.Back_Artwork_URL;
  }

  card3D.className = `card-3d variant-${variant}`;
  modalOverlay.classList.add("active");
}

function closeModal(event) {
  if (event.target === modalOverlay && modalOverlay) {
    modalOverlay.classList.remove("active");
    if (card3D) card3D.style.transform = "rotateX(0deg) rotateY(0deg)";
  }
}

if (modalOverlay && card3D) {
  modalOverlay.addEventListener("mousemove", (e) => {
    const rect = card3D.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -60;
    const rotateY = ((x - centerX) / centerX) * 60;

    const deg = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;

    card3D.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card3D.style.setProperty("--pointer-deg", `${deg}deg`);
    card3D.style.setProperty("--pointer-opacity", "0.9");
  });

  modalOverlay.addEventListener("mouseleave", () => {
    card3D.style.transform = "rotateX(0deg) rotateY(0deg)";
    card3D.style.setProperty("--pointer-opacity", "0");
  });
}

initBinder();
