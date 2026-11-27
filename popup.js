// Viser et resultat uden at bruge innerHTML (så et link aldrig kan blive til kode)
function visResultat(boks, overskrift, farve, linjer) {
  boks.style.background = farve;
  boks.textContent = "";
  const titel = document.createElement("b");
  titel.textContent = overskrift;
  boks.appendChild(titel);
  for (const linje of linjer) {
    boks.appendChild(document.createElement("br"));
    boks.appendChild(document.createTextNode(linje));
  }
}

// Tjekker et link og viser svaret i en boks.
// Bruges af popup'en, højreklik-vinduet (tjek.html) og QR-siden (qr.html).
async function tjekOgVis(input, resultat) {
  let linkDerTjekkes = input;
  const ekstra = [];

  // Forkortet link? Find ud af, hvor det fører hen
  if (erForkortetLink(input)) {
    visResultat(resultat, t("venter", "Et øjeblik..."), "", [t("finderDestination", "Finder ud af, hvor det forkortede link fører hen.")]);
    const destination = await findDestination(input);
    if (destination) {
      linkDerTjekkes = destination;
      ekstra.push(t("forkortetFoererTil", "Det forkortede link fører til: {1}", destination));
    } else {
      ekstra.push(t("forkortetUkendt", "Kunne ikke finde ud af, hvor det forkortede link fører hen."));
    }
  }

  const svar = checkLink(linkDerTjekkes);

  if (svar === null) {
    visResultat(resultat, t("ugyldigt", "Det ligner ikke et gyldigt link."), "", []);
    return;
  }

  taelOp("tjek");

  // Spørg Google Safe Browsing (kun hvis der er en nøgle i indstillingerne)
  const google = await tjekSafeBrowsing(linkDerTjekkes);
  if (google === true) {
    svar.point += 10;
    ekstra.push(t("grundGoogle", "Google Safe Browsing har meldt siden som mistænkt phishing eller skadelig.") + " (Advisory provided by Google)");
  }

  // Har brugeren selv valgt at stole på siden? (gælder kun gule sider)
  const vaert = new URL(linkDerTjekkes.startsWith("http") ? linkDerTjekkes : "https://" + linkDerTjekkes).hostname;
  if (svar.point > 0 && svar.point < 3 && await erBetroet(vaert)) {
    visResultat(resultat, t("betroetTitel", "🟢 Du stoler på denne side"), "#d4edda",
      [t("betroetTekst", "Du har selv markeret siden som betroet. Ret det under ⚙ Indstillinger.")]);
    return;
  }

  const linjer = ekstra.concat(svar.grunde);

  if (svar.point >= 3) {
    visResultat(resultat, t("resultatRoed", "🔴 Sandsynligvis phishing"), "#f8d7da", linjer);
  } else if (svar.point >= 1) {
    visResultat(resultat, t("resultatGul", "🟡 Vær forsigtig"), "#fff3cd", linjer);
  } else {
    visResultat(resultat, t("resultatGroen", "🟢 Ser sikkert ud"), "#d4edda",
      linjer.concat([t("ingenTegn", "Vi fandt ingen tydelige tegn på phishing.")]));
  }
}

// Oversæt teksterne på siden (gør intet på hjemmesiden, som ikke har data-i18n)
oversaetSiden();

// "Tjek link"-knappen (findes i popup'en og på hjemmesiden)
const tjekKnap = document.getElementById("tjekKnap");
if (tjekKnap) {
  tjekKnap.addEventListener("click", () => {
    const input = document.getElementById("link").value.trim();
    tjekOgVis(input, document.getElementById("resultat"));
  });
}

// Links, der kun findes i udvidelsen, ikke på hjemmesiden
const indstillingerLink = document.getElementById("indstillinger");
if (indstillingerLink) {
  indstillingerLink.addEventListener("click", (event) => {
    event.preventDefault();
    api.runtime.openOptionsPage();
  });
}

const qrKnap = document.getElementById("qrKnap");
if (qrKnap) {
  qrKnap.addEventListener("click", () => {
    api.tabs.create({ url: api.runtime.getURL("qr.html") });
  });
}

const statistikLink = document.getElementById("statistikLink");
if (statistikLink) {
  statistikLink.addEventListener("click", (event) => {
    event.preventDefault();
    api.tabs.create({ url: api.runtime.getURL("statistik.html") });
  });
}
