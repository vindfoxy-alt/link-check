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

document.getElementById("tjekKnap").addEventListener("click", async () => {
  const input = document.getElementById("link").value.trim();
  const resultat = document.getElementById("resultat");
  let linkDerTjekkes = input;
  const ekstra = [];

  // Forkortet link? Find ud af, hvor det fører hen
  if (erForkortetLink(input)) {
    visResultat(resultat, "Et øjeblik...", "", ["Finder ud af, hvor det forkortede link fører hen."]);
    const destination = await findDestination(input);
    if (destination) {
      linkDerTjekkes = destination;
      ekstra.push("Det forkortede link fører til: " + destination);
    } else {
      ekstra.push("Kunne ikke finde ud af, hvor det forkortede link fører hen.");
    }
  }

  const svar = checkLink(linkDerTjekkes);

  if (svar === null) {
    visResultat(resultat, "Det ligner ikke et gyldigt link.", "", []);
    return;
  }

  const linjer = ekstra.concat(svar.grunde);

  if (svar.point >= 3) {
    visResultat(resultat, "🔴 Sandsynligvis phishing", "#f8d7da", linjer);
  } else if (svar.point >= 1) {
    visResultat(resultat, "🟡 Vær forsigtig", "#fff3cd", linjer);
  } else {
    visResultat(resultat, "🟢 Ser sikkert ud", "#d4edda", linjer.concat(["Vi fandt ingen tydelige tegn på phishing."]));
  }
});

// Link til indstillinger (findes kun i udvidelsen, ikke på hjemmesiden)
const indstillingerLink = document.getElementById("indstillinger");
if (indstillingerLink) {
  indstillingerLink.addEventListener("click", (event) => {
    event.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}