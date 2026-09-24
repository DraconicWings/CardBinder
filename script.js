// PASTE YOUR PUBLISHED GOOGLE SHEET CSV LINKS HERE WHEN READY
const MASTER_CARDS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSw7uMK-pIYU0n_l8ypDgW2GrgLgnQIO5_j6phxej4IetUEDbzizT-xr4X1nV2TPQEYF2fvT2JBdpjJ/pub?gid=0&single=true&output=csv";
const USER_INVENTORY_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSw7uMK-pIYU0n_l8ypDgW2GrgLgnQIO5_j6phxej4IetUEDbzizT-xr4X1nV2TPQEYF2fvT2JBdpjJ/pub?gid=923512728&single=true&output=csv";

// Local demo card set (Runs automatically until Google Sheets CSVs are connected)
const demoCards = Array.from({ length: 30 }, (_, i) => ({
  Card_ID: `CARD-00${i + 1}`,
  Card_Name: `Test Card #${i + 1}`,
  Artwork_URL: "https://i.imgur.com/rarZMX6.png",
  Variant_Type: "Normal",
  count: i % 3 === 0 ? 0 : (i % 2 === 0 ? 3 : 1)
}));

let masterCards = demoCards;
let filteredUserCards = demoCards;
let currentPage = 1;
const CARDS_PER_PAGE = 18;

function renderPages() {
  const leftPage = document.getElementById("leftPage");
  const rightPage = document.getElementById("rightPage");
  leftPage.innerHTML = "";
  rightPage.innerHTML = "";

  const totalPages = Math.ceil(filteredUserCards.length / CARDS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const pageCards = filteredUserCards.slice(startIndex, startIndex + CARDS_PER_PAGE);

  pageCards.forEach((card, index) => {
    const slot = document.createElement("div");
    const isOwned = card.count > 0;
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

  document.getElementById("pageIndicator").innerText = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages;
}

function filterVariant() {
  const selectedVariant = document.getElementById("variantSelect").value;
  filteredUserCards = masterCards.map(card => ({
    ...card,
    Variant_Type: selectedVariant
  }));
  currentPage = 1;
  renderPages();
}

function changePage(direction) {
  currentPage += direction;
  renderPages();
}

// 3D Tilt Mechanics
const modalOverlay = document.getElementById("modalOverlay");
const card3D = document.getElementById("card3D");
const modalCardImg = document.getElementById("modalCardImg");

function openModal(card) {
  const variant = (card.Variant_Type || 'Normal').toLowerCase();
  modalCardImg.src = card.Artwork_URL;
  card3D.className = `card-3d variant-${variant} ${card.count === 0 ? 'unobtained' : ''}`;
  modalOverlay.classList.add("active");
}

function closeModal(event) {
  if (event.target === modalOverlay) {
    modalOverlay.classList.remove("active");
    card3D.style.transform = `rotateX(0deg) rotateY(0deg)`;
  }
}

modalOverlay.addEventListener("mousemove", (e) => {
  const rect = card3D.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * -20; 
  const rotateY = ((x - centerX) / centerX) * 20;

  const deg = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;

  card3D.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  card3D.style.setProperty("--pointer-deg", `${deg}deg`);
  card3D.style.setProperty("--pointer-opacity", `0.85`);
});

modalOverlay.addEventListener("mouseleave", () => {
  card3D.style.transform = `rotateX(0deg) rotateY(0deg)`;
  card3D.style.setProperty("--pointer-opacity", `0`);
});

// Initial Load
renderPages();