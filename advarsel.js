// Hent den farlige adresse fra sidens egen adresse (?url=...)
const params = new URLSearchParams(location.search);
const farligUrl = params.get("url");

document.getElementById("adresse").textContent = farligUrl;

// Sætter farve, tekster og grunde ud fra et svar fra checkLink
function visAdvarsel(svar, ekstraGrunde) {
  if (svar && svar.point >= 3) {
    document.body.className = "roed";
    document.getElementById("overskrift").textContent = "Er du sikker på, at du vil åbne denne side?";
    document.getElementById("beskrivelse").textContent = "Phishing Tjek mener, at denne side sandsynligvis er phishing:";
    document.getElementById("tilbage").textContent = "Gå tilbage (anbefalet)";
  } else {
    document.body.className = "gul";
    document.getElementById("overskrift").textContent = "Vær forsigtig med denne side";
    document.getElementById("beskrivelse").textContent = "Phishing Tjek har fundet nogle advarselstegn ved denne side:";
    document.getElementById("tilbage").textContent = "Gå tilbage";
  }

  const liste = document.getElementById("grunde");
  liste.textContent = "";
  const alleGrunde = ekstraGrunde.concat(svar ? svar.grunde : []);
  for (const grund of alleGrunde) {
    const punkt = document.createElement("li");
    punkt.textContent = grund;
    liste.appendChild(punkt);
  }
}

// Først: vis advarslen for selve linket
const svar = checkLink(farligUrl);
visAdvarsel(svar, []);

// Forkortet link? Find destinationen og tjek den også
async function tjekDestination() {
  if (!erForkortetLink(farligUrl)) return;

  const destinationTekst = document.getElementById("destination");
  destinationTekst.textContent = "Finder ud af, hvor linket fører hen...";

  const destination = await findDestination(farligUrl);
  if (!destination) {
    destinationTekst.textContent = "Kunne ikke finde ud af, hvor linket fører hen.";
    return;
  }

  destinationTekst.textContent = "Linket fører til: " + destination;

  // Tjek destinationen, og læg point sammen
  const destSvar = checkLink(destination);
  if (destSvar && svar) {
    const samlet = { point: svar.point + destSvar.point, grunde: svar.grunde };
    const destGrunde = destSvar.grunde.map(g => "Destinationen: " + g);
    visAdvarsel(samlet, destGrunde);
  }
}
tjekDestination();

// "Gå tilbage"
document.getElementById("tilbage").addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
  } else {
    chrome.tabs.update({ url: "chrome://newtab" });
  }
});

// "Fortsæt alligevel": husk siden, så den ikke bliver blokeret igen, og åbn den
document.getElementById("fortsaet").addEventListener("click", async () => {
  const host = new URL(farligUrl).hostname;
  const gemt = await chrome.storage.session.get("tilladte");
  const tilladte = gemt.tilladte || [];
  tilladte.push(host);
  await chrome.storage.session.set({ tilladte: tilladte });
  location.href = farligUrl;
});
