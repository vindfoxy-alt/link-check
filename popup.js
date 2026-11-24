const kendteDomaener = ["mitid.dk", "borger.dk", "skat.dk", "postnord.dk",
  "danskebank.dk", "nordea.dk", "microsoft.com", "paypal.com", "apple.com"];
const mistaenkeligeEndelser = [".xyz", ".top", ".click", ".ru", ".tk", ".zip"];
const forkortere = ["bit.ly", "tinyurl.com", "t.co", "is.gd"];
const farligeOrd = ["login", "verify", "konto", "betaling", "opdater", "secure"];

document.getElementById("tjekKnap").addEventListener("click", () => {
  const input = document.getElementById("link").value.trim();
  const resultat = document.getElementById("resultat");
  let url;

  try {
    url = new URL(input.startsWith("http") ? input : "https://" + input);
  } catch {
    resultat.textContent = "Det ligner ikke et gyldigt link.";
    return;
  }

  const host = url.hostname.toLowerCase();
  let point = 0;
  const grunde = [];

  if (url.protocol === "http:") { point++; grunde.push("Linket bruger ikke https."); }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) { point += 2; grunde.push("Linket bruger en IP-adresse i stedet for et navn."); }
  if (input.includes("@")) { point += 2; grunde.push("Linket indeholder @, som kan skjule den rigtige adresse."); }
  if (host.split(".").length > 3) { point++; grunde.push("Linket har mange underdomæner."); }
  if (mistaenkeligeEndelser.some(e => host.endsWith(e))) { point++; grunde.push("Domænet har en endelse, der ofte bruges til svindel."); }
  if (forkortere.includes(host)) { point++; grunde.push("Det er et forkortet link, så man kan ikke se, hvor det fører hen."); }
  if (farligeOrd.some(o => url.href.toLowerCase().includes(o))) { point++; grunde.push("Linket indeholder ord som 'login' eller 'betaling'."); }

  // Ligner det et kendt firma, men er det ikke?
  const normaliseret = host.replace(/0/g, "o").replace(/1/g, "l");
  for (const d of kendteDomaener) {
    const navn = d.split(".")[0];
    const erAegte = host === d || host.endsWith("." + d);
    if (normaliseret.includes(navn) && !erAegte) {
      point += 3;
      grunde.push(`Linket ligner ${d}, men er ikke det rigtige domæne.`);
    }
  }

  if (point >= 3) {
    resultat.style.background = "#f8d7da";
    resultat.innerHTML = "<b>🔴 Sandsynligvis phishing</b><br>" + grunde.join("<br>");
  } else if (point >= 1) {
    resultat.style.background = "#fff3cd";
    resultat.innerHTML = "<b>🟡 Vær forsigtig</b><br>" + grunde.join("<br>");
  } else {
    resultat.style.background = "#d4edda";
    resultat.innerHTML = "<b>🟢 Ser sikkert ud</b><br>Vi fandt ingen tydelige tegn på phishing.";
  }
});