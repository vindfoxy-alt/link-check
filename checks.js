// Virker i både Chrome-browsere og Firefox: Firefox bruger "browser", Chrome "chrome"
const api = globalThis.browser ?? globalThis.chrome;

const kendteDomaener = ["mitid.dk", "borger.dk", "skat.dk", "postnord.dk",
  "danskebank.dk", "nordea.dk", "microsoft.com", "paypal.com", "apple.com",
  "e-boks.dk", "mobilepay.dk", "sundhed.dk", "jyskebank.dk", "sydbank.dk", "nykredit.dk",
  "netflix.com", "facebook.com", "instagram.com",
  "google.com", "google.dk", "youtube.com", "github.com", "wikipedia.org"];

// Store, kendte sider, der aldrig får en advarsel (de kendte firmaer ovenfor er også med).
// Disse fire er kun "sikre", ikke look-alike, fordi korte navne som "dr" giver falske alarmer.
const sikreDomaener = kendteDomaener.concat(["live.com", "office.com", "dr.dk", "tv2.dk"]);
// Firmaernes egne ekstra domæner, som ikke må tælle som look-alikes
// (f.eks. ligger hjemmesider på GitHub Pages på github.io)
const egneDomaener = { "github.com": ["github.io"], "google.com": ["google.dk"], "google.dk": ["google.com"] };

const mistaenkeligeEndelser = [".xyz", ".top", ".click", ".ru", ".tk", ".zip"];
const forkortere = ["bit.ly", "tinyurl.com", "t.co", "is.gd"];
const farligeOrd = ["login", "verify", "konto", "betaling", "opdater", "secure"];

// Oversæt en "xn--"-del af en adresse (punycode) tilbage til de bogstaver, brugeren ser
function punycodeTilTekst(del) {
  if (!del.startsWith("xn--")) return del;
  const input = del.slice(4);
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  let n = 128, i = 0, bias = 72;
  const output = [];
  const skille = input.lastIndexOf("-");
  for (let j = 0; j < Math.max(skille, 0); j++) output.push(input.charCodeAt(j));
  let index = skille > 0 ? skille + 1 : 0;
  while (index < input.length) {
    const gammelI = i;
    for (let w = 1, k = base; ; k += base) {
      if (index >= input.length) return del;
      const c = input.charCodeAt(index++);
      const ciffer = c >= 48 && c <= 57 ? c - 22 : c >= 65 && c <= 90 ? c - 65 : c >= 97 && c <= 122 ? c - 97 : base;
      if (ciffer >= base) return del;
      i += ciffer * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (ciffer < t) break;
      w *= base - t;
    }
    const laengde = output.length + 1;
    let delta = gammelI === 0 ? Math.floor((i - gammelI) / damp) : Math.floor((i - gammelI) / 2);
    delta += Math.floor(delta / laengde);
    let k = 0;
    while (delta > ((base - tMin) * tMax) >> 1) { delta = Math.floor(delta / (base - tMin)); k += base; }
    bias = k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
    n += Math.floor(i / laengde);
    i %= laengde;
    output.splice(i, 0, n);
    i++;
  }
  return String.fromCodePoint(...output);
}

// Kyrilliske og græske bogstaver, der ligner latinske
const lignendeBogstaver = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
  "і": "i", "ј": "j", "ѕ": "s", "к": "k", "м": "m", "т": "t", "в": "b", "н": "h",
  "ο": "o", "α": "a", "ρ": "p", "ν": "v", "τ": "t", "κ": "k", "ι": "i", "ε": "e"
};

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

  // Kendt, sikker side? Så stopper vi her og giver 0 point
  const erSikker = sikreDomaener.some(d => host === d || host.endsWith("." + d));
  if (erSikker && url.protocol === "https:" && !text.includes("@")) {
    return { point: 0, grunde: [] };
  }

  // Bogstaver fra et andet alfabet, der ligner almindelige bogstaver?
  const visteHost = host.split(".").map(punycodeTilTekst).join(".");
  if (/[\u0370-\u03FF\u0400-\u04FF]/.test(visteHost)) {
    point += 3;
    grunde.push("Adressen bruger bogstaver fra et andet alfabet, der ligner almindelige bogstaver (" + visteHost + ").");
  }

  if (url.protocol === "http:") { point++; grunde.push("Linket bruger ikke https."); }
  const erIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (erIP) { point += 2; grunde.push("Linket bruger en IP-adresse i stedet for et navn."); }
  if (text.includes("@")) { point += 2; grunde.push("Linket indeholder @, som kan skjule den rigtige adresse."); }
  if (!erIP && host.split(".").length > 3) { point++; grunde.push("Linket har mange underdomæner."); }
  if (mistaenkeligeEndelser.some(e => host.endsWith(e))) { point++; grunde.push("Domænet har en endelse, der ofte bruges til svindel."); }
  if (forkortere.includes(host)) { point++; grunde.push("Det er et forkortet link, så man kan ikke se, hvor det fører hen."); }
  if (farligeOrd.some(o => url.href.toLowerCase().includes(o))) { point++; grunde.push("Linket indeholder ord som 'login' eller 'betaling'."); }

  // Ligner det et kendt firma, men er det ikke?
  const normaliseret = [...visteHost].map(b => lignendeBogstaver[b] || b).join("")
    .replace(/0/g, "o").replace(/1/g, "l");
  for (const d of kendteDomaener) {
    const navn = d.split(".")[0];
    const aegteDomaener = [d].concat(egneDomaener[d] || []);
    const erAegte = aegteDomaener.some(e => host === e || host.endsWith("." + e));
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
  if (!api || !api.storage) return null;                              // hjemmesiden har ingen nøgle

  const gemt = await api.storage.local.get({ safeBrowsingNoegle: "" });
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
