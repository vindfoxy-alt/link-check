// Oversæt teksterne på siden (t() og oversaetSiden() kommer fra checks.js)
oversaetSiden();

// Hent den farlige adresse fra sidens egen adresse (?url=...)
const params = new URLSearchParams(location.search);
const farligUrl = params.get("url");

document.getElementById("adresse").textContent = farligUrl;

// Sætter farve, tekster og grunde ud fra et svar fra checkLink
function visAdvarsel(svar, ekstraGrunde) {
  if (svar && svar.point >= 3) {
    document.body.className = "roed";
    document.getElementById("overskrift").textContent = t("overskriftRoed", "Er du sikker på, at du vil åbne denne side?");
    document.getElementById("beskrivelse").textContent = t("beskrivelseRoed", "Phishing Tjek mener, at denne side sandsynligvis er phishing:");
    document.getElementById("tilbage").textContent = t("tilbageAnbefalet", "Gå tilbage (anbefalet)");
  } else {
    document.body.className = "gul";
    document.getElementById("overskrift").textContent = t("overskriftGul", "Vær forsigtig med denne side");
    document.getElementById("beskrivelse").textContent = t("beskrivelseGul", "Phishing Tjek har fundet nogle advarselstegn ved denne side:");
    document.getElementById("tilbage").textContent = t("tilbage", "Gå tilbage");
  }

  const liste = document.getElementById("grunde");
  liste.textContent = "";
  const alleGrunde = ekstraGrunde.concat(svar ? svar.grunde : []);
  for (const grund of alleGrunde) {
    const punkt = document.createElement("li");
    punkt.textContent = grund;
    liste.appendChild(punkt);
  }

  lavMeldLink(alleGrunde);
}

// "Meld til IT": en færdig e-mail med linket og grundene
async function lavMeldLink(grunde) {
  const gemt = await api.storage.sync.get({ itEmail: "" });
  const emne = t("mailEmne", "Mistænkeligt link (Phishing Tjek)");
  const tekst = t("mailTekst",
    "Hej IT-support\n\nPhishing Tjek advarede mig om dette link:\n{1}\n\nDerfor:\n{2}\n\n" +
    "Hvor fik jeg linket fra (e-mail, sms, hjemmeside)? \n" +
    "Har jeg klikket på noget eller indtastet oplysninger? \n\nVenlig hilsen",
    farligUrl, grunde.map(g => "- " + g).join("\n"));
  document.getElementById("meld").href =
    "mailto:" + encodeURIComponent(gemt.itEmail) +
    "?subject=" + encodeURIComponent(emne) +
    "&body=" + encodeURIComponent(tekst);
}

const fraGoogle = params.get("google") === "1";

// Ingen advarselstegn og ikke fra Google? Så er siden sikker (f.eks. hvis baggrunden
// kørte en gammel version af koden). Husk den for denne gang, og åbn den med det samme.
async function aabnHvisSikker() {
  const tjek = checkLink(farligUrl);
  if (fraGoogle || !tjek || tjek.point > 0) return false;
  const host = new URL(farligUrl).hostname;
  const gemt = await api.storage.session.get("tilladte");
  const tilladte = gemt.tilladte || [];
  tilladte.push(host);
  await api.storage.session.set({ tilladte: tilladte });
  location.replace(farligUrl);
  return true;
}
aabnHvisSikker();

// Først: vis advarslen for selve linket
let svar = checkLink(farligUrl);
if (fraGoogle && svar) {
  svar = { point: svar.point + 10, grunde: svar.grunde };   // Googles liste gør altid siden rød
  document.getElementById("google").hidden = false;
}
visAdvarsel(svar, fraGoogle ? [t("grundGoogle", "Google Safe Browsing har meldt siden som mistænkt phishing eller skadelig.")] : []);

// Forkortet link? Find destinationen og tjek den også
async function tjekDestination() {
  if (!erForkortetLink(farligUrl)) return;

  const destinationTekst = document.getElementById("destination");
  destinationTekst.textContent = t("finderDestination", "Finder ud af, hvor det forkortede link fører hen.");

  const destination = await findDestination(farligUrl);
  if (!destination) {
    destinationTekst.textContent = t("forkortetUkendt", "Kunne ikke finde ud af, hvor det forkortede link fører hen.");
    return;
  }

  destinationTekst.textContent = t("forkortetFoererTil", "Det forkortede link fører til: {1}", destination);

  // Tjek destinationen, og læg point sammen
  const destSvar = checkLink(destination);
  if (destSvar && svar) {
    const samlet = { point: svar.point + destSvar.point, grunde: svar.grunde };
    const destGrunde = destSvar.grunde.map(g => t("destinationGrund", "Destinationen: {1}", g));
    if (fraGoogle) destGrunde.unshift(t("grundGoogle", "Google Safe Browsing har meldt siden som mistænkt phishing eller skadelig."));
    visAdvarsel(samlet, destGrunde);
  }
}
tjekDestination();

// "Gå tilbage"
document.getElementById("tilbage").addEventListener("click", async () => {
  if (history.length > 1) {
    history.back();
  } else {
    // Ingen side at gå tilbage til: luk fanen (virker i både Chrome og Firefox)
    const fane = await api.tabs.getCurrent();
    api.tabs.remove(fane.id);
  }
});

// "Jeg stoler på denne side" (kun gule sider): gem siden for altid, og åbn den
document.getElementById("stol").addEventListener("click", async () => {
  await stolPaa(new URL(farligUrl).hostname);
  location.href = farligUrl;
});

// "Fortsæt alligevel": husk siden, så den ikke bliver blokeret igen, og åbn den
document.getElementById("fortsaet").addEventListener("click", async () => {
  const host = new URL(farligUrl).hostname;
  const gemt = await api.storage.session.get("tilladte");
  const tilladte = gemt.tilladte || [];
  tilladte.push(host);
  await api.storage.session.set({ tilladte: tilladte });
  location.href = farligUrl;
});
