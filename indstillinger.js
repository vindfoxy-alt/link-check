const api = globalThis.browser ?? globalThis.chrome;   // Firefox: "browser", Chrome: "chrome"

const boks = document.getElementById("gulAdvarsel");
const gemt = document.getElementById("gemt");

// Vis den gemte indstilling, når siden åbner (standard: slået fra)
api.storage.sync.get({ gulAdvarsel: false }).then((indstillinger) => {
  boks.checked = indstillinger.gulAdvarsel;
});

// Gem med det samme, når brugeren klikker
boks.addEventListener("change", async () => {
  await api.storage.sync.set({ gulAdvarsel: boks.checked });
  gemt.textContent = "Gemt ✓";
  setTimeout(() => { gemt.textContent = ""; }, 1500);
});

// Google Safe Browsing-nøgle (gemmes kun på denne computer)
const noegleFelt = document.getElementById("noegle");
const noegleStatus = document.getElementById("noegleStatus");

function visNoegleStatus(noegle) {
  noegleStatus.textContent = noegle ? "Slået til: der er gemt en nøgle." : "Slået fra: ingen nøgle gemt.";
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
