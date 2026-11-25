const kendteDomaener = ["mitid.dk", "borger.dk", "skat.dk", "postnord.dk",
  "danskebank.dk", "nordea.dk", "microsoft.com", "paypal.com", "apple.com"];
const mistaenkeligeEndelser = [".xyz", ".top", ".click", ".ru", ".tk", ".zip"];
const forkortere = ["bit.ly", "tinyurl.com", "t.co", "is.gd"];
const farligeOrd = ["login", "verify", "konto", "betaling", "opdater", "secure"];

function checkLink(text) {
  let url;
  try {
    url = new URL(text.startsWith("http") ? text : "https://" + text);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  let point = 0;
  const grunde = [];

  if (url.protocol === "http:") { point++; grunde.push("Linket bruger ikke https."); }
  const erIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (erIP) { point += 2; grunde.push("Linket bruger en IP-adresse i stedet for et navn."); }
  if (text.includes("@")) { point += 2; grunde.push("Linket indeholder @, som kan skjule den rigtige adresse."); }
  if (!erIP && host.split(".").length > 3) { point++; grunde.push("Linket har mange underdomæner."); }
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

  return { point: point, grunde: grunde };
}

// Er det et forkortet link (bit.ly, tinyurl osv.)?
function erForkortetLink(link) {
  try {
    const u = new URL(link.startsWith("http") ? link : "https://" + link);
    return forkortere.includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Find ud af, hvor et forkortet link fører hen, uden at åbne det
async function findDestination(link) {
  const fuldtLink = link.startsWith("http") ? link : "https://" + link;
  try {
    let svar = await fetch(fuldtLink, { method: "HEAD", redirect: "follow", credentials: "omit" });
    if (svar.status === 405) {
      // Nogle tjenester tillader ikke HEAD, så prøv en almindelig forespørgsel
      svar = await fetch(fuldtLink, { redirect: "follow", credentials: "omit" });
    }
    if (svar.url && svar.url !== fuldtLink) return svar.url;
    return null;
  } catch {
    return null;
  }
}

// Spørg Google Safe Browsing, om linket står på Googles liste over farlige sider.
// Svarer true (på listen), false (ikke på listen) eller null (kunne ikke tjekke).
async function tjekSafeBrowsing(link) {
  if (typeof chrome === "undefined" || !chrome.storage) return null;   // hjemmesiden har ingen nøgle

  const gemt = await chrome.storage.local.get({ safeBrowsingNoegle: "" });
  const noegle = gemt.safeBrowsingNoegle;
  if (!noegle) return null;                                             // ingen nøgle = slået fra

  const fuldtLink = link.startsWith("http") ? link : "https://" + link;
  try {
    const svar = await fetch(
      "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + encodeURIComponent(noegle),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "phishing-tjek", clientVersion: "1.6" },
          threatInfo: {
            threatTypes: ["SOCIAL_ENGINEERING", "MALWARE", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: fuldtLink }]
          }
        })
      }
    );
    if (!svar.ok) return null;
    const data = await svar.json();
    return Array.isArray(data.matches) && data.matches.length > 0;
  } catch {
    return null;
  }
}
