// api, t() og oversaetSiden() kommer fra checks.js, som indlæses først
oversaetSiden();

const boks = document.getElementById("gulAdvarsel");
const gemt = document.getElementById("gemt");

// Vis den gemte indstilling, når siden åbner (standard: slået fra)
api.storage.sync.get({ gulAdvarsel: false }).then((indstillinger) => {
  boks.checked = indstillinger.gulAdvarsel;
});

// Gem med det samme, når brugeren klikker
boks.addEventListener("change", async () => {
  await api.storage.sync.set({ gulAdvarsel: boks.checked });
  gemt.textContent = t("gemt", "Gemt ✓");
  setTimeout(() => { gemt.textContent = ""; }, 1500);
});

// Google Safe Browsing-nøgle (gemmes kun på denne computer)
const noegleFelt = document.getElementById("noegle");
const noegleStatus = document.getElementById("noegleStatus");

function visNoegleStatus(noegle) {
  noegleStatus.textContent = noegle ? t("noegleTil", "Slået til: der er gemt en nøgle.") : t("noegleFra", "Slået fra: ingen nøgle gemt.");
}

api.storage.local.get({ safeBrowsingNoegle: "" }).then((gemt) => {
  visNoegleStatus(gemt.safeBrowsingNoegle);
});

document.getElementById("gemNoegle").addEventListener("click", async () => {
  const noegle = noegleFelt.value.trim();
  if (!noegle) return;
  await api.storage.local.set({ safeBrowsingNoegle: noegle });
  noegleFelt.value = "";
  visNoegleStatus(noegle);
});

document.getElementById("fjernNoegle").addEventListener("click", async () => {
  await api.storage.local.remove("safeBrowsingNoegle");
  visNoegleStatus("");
});

// IT-supportens e-mail til "Meld til IT"
const emailFelt = document.getElementById("itEmail");

api.storage.sync.get({ itEmail: "" }).then((gemt) => {
  emailFelt.value = gemt.itEmail;
});

document.getElementById("gemEmail").addEventListener("click", async () => {
  await api.storage.sync.set({ itEmail: emailFelt.value.trim() });
  gemt.textContent = t("gemt", "Gemt ✓");
  setTimeout(() => { gemt.textContent = ""; }, 1500);
});

// Liste over sider, brugeren stoler på, med en "Fjern"-knap ved hver
async function visBetroede() {
  const liste = document.getElementById("betroedeListe");
  const { betroedeSider } = await api.storage.local.get({ betroedeSider: [] });
  liste.textContent = "";
  if (betroedeSider.length === 0) {
    const tom = document.createElement("li");
    tom.textContent = t("ingenEndnu", "Ingen endnu.");
    liste.appendChild(tom);
    return;
  }
  for (const side of betroedeSider) {
    const punkt = document.createElement("li");
    punkt.textContent = side + " ";
    const fjern = document.createElement("button");
    fjern.textContent = t("fjern", "Fjern");
    fjern.addEventListener("click", async () => {
      const nyListe = betroedeSider.filter(s => s !== side);
      await api.storage.local.set({ betroedeSider: nyListe });
      visBetroede();
    });
    punkt.appendChild(fjern);
    liste.appendChild(punkt);
  }
}
visBetroede();

// Link til statistik-siden
document.getElementById("statistikLink").addEventListener("click", (event) => {
  event.preventDefault();
  api.tabs.create({ url: api.runtime.getURL("statistik.html") });
});
