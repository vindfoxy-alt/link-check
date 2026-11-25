const boks = document.getElementById("gulAdvarsel");
const gemt = document.getElementById("gemt");

// Vis den gemte indstilling, når siden åbner (standard: slået fra)
chrome.storage.sync.get({ gulAdvarsel: false }).then((indstillinger) => {
  boks.checked = indstillinger.gulAdvarsel;
});

// Gem med det samme, når brugeren klikker
boks.addEventListener("change", async () => {
  await chrome.storage.sync.set({ gulAdvarsel: boks.checked });
  gemt.textContent = "Gemt ✓";
  setTimeout(() => { gemt.textContent = ""; }, 1500);
});