// Statistik-siden: læs tallene fra storage.local og vis dem som "fliser"
oversaetSiden();

// Hver slags tal: nøglen i statistikken, navnet på flisen og farven
const slags = [
  { noegle: "roed", navn: t("statRoed", "Røde advarsler"), klasse: "roed" },
  { noegle: "gul", navn: t("statGul", "Gule advarsler"), klasse: "gul" },
  { noegle: "adgangskode", navn: t("statAdgangskode", "Adgangskode-advarsler"), klasse: "" },
  { noegle: "uoverens", navn: t("statUoverens", "Falske link-tekster stoppet"), klasse: "" },
  { noegle: "tjek", navn: t("statTjek", "Links du har tjekket"), klasse: "" },
  { noegle: "qr", navn: t("statQR", "QR-koder tjekket"), klasse: "" }
];

function lavFliser(beholder, tal) {
  beholder.textContent = "";
  for (const s of slags) {
    const flise = document.createElement("div");
    flise.className = "flise " + s.klasse;
    const tekstTal = document.createElement("div");
    tekstTal.className = "tal";
    tekstTal.textContent = tal[s.noegle] || 0;
    const navn = document.createElement("div");
    navn.className = "navn";
    navn.textContent = s.navn;
    flise.append(tekstTal, navn);
    beholder.appendChild(flise);
  }
}

async function visStatistik() {
  const { statistik } = await api.storage.local.get({ statistik: {} });
  const maaned = new Date().toISOString().slice(0, 7);

  // Læg alle måneder sammen til "I alt"
  const ialt = {};
  for (const tal of Object.values(statistik)) {
    for (const [noegle, antal] of Object.entries(tal)) {
      ialt[noegle] = (ialt[noegle] || 0) + antal;
    }
  }

  lavFliser(document.getElementById("maaned"), statistik[maaned] || {});
  lavFliser(document.getElementById("ialt"), ialt);
}

document.getElementById("nulstil").addEventListener("click", async () => {
  if (!confirm(t("statNulstilSpoerg", "Vil du slette al statistik? Det kan ikke fortrydes."))) return;
  await api.storage.local.remove("statistik");
  visStatistik();
});

visStatistik();
