// Phishing-quiz: hvert spørgsmål har en type, en tekst, det rigtige svar og en forklaring
const spoergsmaal = [
  { type: "Et link", tekst: "https://mitid.dk", svar: "sikker",
    forklaring: "Det rigtige MitID-domæne med https. Der er ikke noget foran eller efter mitid.dk." },
  { type: "Et link", tekst: "https://mitid-login.xyz/konto", svar: "phishing",
    forklaring: "Navnet ligner MitID, men domænet er mitid-login.xyz. Endelsen .xyz bruges ofte til svindel." },
  { type: "Et link", tekst: "https://www.paypa1.com/verify", svar: "phishing",
    forklaring: "Der står paypa1 med tallet 1 i stedet for bogstavet l. Et klassisk look-alike-trick." },
  { type: "Et link", tekst: "https://skat.dk/borger", svar: "sikker",
    forklaring: "Skattestyrelsens rigtige domæne. Stien efter skråstregen (/borger) ændrer ikke, hvem siden tilhører." },
  { type: "En sms", tekst: "PostNord: Din pakke venter. Betal 19 kr. i told her: http://192.0.2.44/postnord/levering", svar: "phishing",
    forklaring: "Linket er en IP-adresse uden https, ikke postnord.dk. Og \"betal et lille beløb\" er et af de mest brugte tricks." },
  { type: "Et link", tekst: "https://www.borger.dk.sikker-adgang.example/", svar: "phishing",
    forklaring: "Læs domænet bagfra: det rigtige domæne er sikker-adgang.example. borger.dk er bare et underdomæne, der skal snyde dig." },
  { type: "Et link", tekst: "https://github.com/vindfoxy-alt/link-check", svar: "sikker",
    forklaring: "GitHubs rigtige domæne. Alt efter github.com/ er bare en side på GitHub." },
  { type: "En e-mail", tekst: "Kære kunde. Vi har spærret din konto. Log ind inden 24 timer:\n[danskebank.dk]\n\n(Når du holder musen over linket, står der: https://danskebank-sikkerhed.click/login)", svar: "phishing",
    forklaring: "Teksten viser danskebank.dk, men linket fører til danskebank-sikkerhed.click. Hold altid musen over et link, før du klikker. Tidspres (\"inden 24 timer\") er også et advarselstegn." },
  { type: "Et link", tekst: "https://www.nordea.dk/privat", svar: "sikker",
    forklaring: "Nordeas rigtige domæne med https." },
  { type: "En QR-kode på en parkeringsautomat", tekst: "https://parkering-betal.example/app?zone=1100", svar: "phishing",
    forklaring: "Svindlere klistrer falske QR-koder oven på de rigtige. Brug parkeringsfirmaets egen app, eller tjek adressen, før du betaler." }
];

let nummer = 0;
let rigtige = 0;

const knapSikker = document.getElementById("sikker");
const knapPhishing = document.getElementById("phishing");
const svarBoks = document.getElementById("svar");
const knapNaeste = document.getElementById("naeste");

function visSpoergsmaal() {
  const s = spoergsmaal[nummer];
  document.getElementById("taeller").textContent = "Spørgsmål " + (nummer + 1) + " af " + spoergsmaal.length;
  document.getElementById("type").textContent = s.type + ":";
  document.getElementById("opgave").textContent = s.tekst;
  svarBoks.textContent = "";
  knapSikker.disabled = false;
  knapPhishing.disabled = false;
  knapNaeste.hidden = true;
}

function svar(valg) {
  const s = spoergsmaal[nummer];
  const korrekt = valg === s.svar;
  if (korrekt) rigtige++;

  svarBoks.style.background = korrekt ? "#d4edda" : "#f8d7da";
  svarBoks.textContent = "";
  const titel = document.createElement("b");
  titel.textContent = (korrekt ? "✅ Rigtigt! " : "❌ Forkert. ") + "Det er " + (s.svar === "sikker" ? "sikkert." : "phishing.");
  svarBoks.append(titel, document.createElement("br"), s.forklaring);

  knapSikker.disabled = true;
  knapPhishing.disabled = true;
  knapNaeste.hidden = false;
  knapNaeste.textContent = nummer === spoergsmaal.length - 1 ? "Se resultat →" : "Næste →";
}

function visSlut() {
  document.getElementById("quiz").hidden = true;
  document.getElementById("slut").hidden = false;
  document.getElementById("point").textContent = rigtige + " / " + spoergsmaal.length;
  let vurdering = "Pas godt på derude. Læs om advarselstegnene, og prøv igen.";
  if (rigtige === spoergsmaal.length) vurdering = "Perfekt! Du er svær at snyde. 🏆";
  else if (rigtige >= 7) vurdering = "Godt gået! Kig forklaringerne igennem for dem, du missede.";
  document.getElementById("vurdering").textContent = vurdering;
}

knapSikker.addEventListener("click", () => svar("sikker"));
knapPhishing.addEventListener("click", () => svar("phishing"));
knapNaeste.addEventListener("click", () => {
  nummer++;
  if (nummer < spoergsmaal.length) visSpoergsmaal();
  else visSlut();
});
document.getElementById("igen").addEventListener("click", () => {
  nummer = 0;
  rigtige = 0;
  document.getElementById("slut").hidden = true;
  document.getElementById("quiz").hidden = false;
  visSpoergsmaal();
});

visSpoergsmaal();
