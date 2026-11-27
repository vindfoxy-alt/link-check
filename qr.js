// QR-siden: læs en QR-kode fra et billede og tjek linket i den.
// Selve aflæsningen klares af biblioteket jsQR (jsQR.js).
const felt = document.getElementById("felt");
const filVaelger = document.getElementById("fil");
const billede = document.getElementById("billede");
const indhold = document.getElementById("indhold");
const qrResultat = document.getElementById("resultat");

async function laesQR(fil) {
  if (!fil || !fil.type.startsWith("image/")) return;

  // Vis billedet, så brugeren kan se, hvad der bliver tjekket
  billede.src = URL.createObjectURL(fil);
  billede.hidden = false;
  indhold.textContent = "";

  // Tegn billedet på et usynligt "lærred" (canvas), så vi kan læse pixelerne
  const bitmap = await createImageBitmap(fil);
  const skala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));   // store billeder gøres mindre
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * skala);
  canvas.height = Math.round(bitmap.height * skala);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Find QR-koden i billedet
  const kode = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" });
  if (!kode) {
    visResultat(qrResultat, t("qrIngen", "Fandt ingen QR-kode i billedet."), "#eef2f5",
      [t("qrIngenTip", "Prøv et skarpere billede, hvor QR-koden fylder mere.")]);
    return;
  }

  taelOp("qr");
  indhold.textContent = kode.data;

  // Er det et link? Så tjekker vi det som alle andre links
  if (/^https?:\/\//i.test(kode.data)) {
    tjekOgVis(kode.data, qrResultat);
  } else {
    visResultat(qrResultat, t("qrTekst", "QR-koden indeholder ikke et link"), "#eef2f5",
      [t("qrTekstForklaring", "Den indeholder teksten ovenfor, f.eks. et wifi-kodeord, et telefonnummer eller en besked.")]);
  }
}

// 1) Klik og vælg en fil
filVaelger.addEventListener("change", () => laesQR(filVaelger.files[0]));

// 2) Træk et billede ind i feltet
felt.addEventListener("dragover", (event) => { event.preventDefault(); felt.classList.add("over"); });
felt.addEventListener("dragleave", () => felt.classList.remove("over"));
felt.addEventListener("drop", (event) => {
  event.preventDefault();
  felt.classList.remove("over");
  laesQR(event.dataTransfer.files[0]);
});

// 3) Sæt et billede ind med Ctrl+V (f.eks. et skærmbillede)
document.addEventListener("paste", (event) => {
  for (const ting of event.clipboardData.items) {
    if (ting.type.startsWith("image/")) laesQR(ting.getAsFile());
  }
});
