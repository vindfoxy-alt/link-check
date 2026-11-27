// Fremhæv farlige links på siden. Kører inde på hver side, du åbner.
const tjekkedeLinks = new WeakSet();

// Ligner linkets TEKST en adresse (f.eks. "mitid.dk" eller "https://www.skat.dk")?
// Svarer med domænet uden "www.", eller null hvis teksten ikke er en adresse.
function tekstensDomaene(tekst) {
  tekst = tekst.trim().toLowerCase();
  if (!tekst || tekst.length > 100 || /\s/.test(tekst)) return null;      // almindelig tekst har mellemrum
  const ligner = /^(https?:\/\/|www\.)/.test(tekst) ||
    /^[a-z0-9.-]+\.(dk|com|org|net|io|eu|de|se|no|uk|nu|info|biz|xyz|top|ru)(\/|$)/.test(tekst);
  if (!ligner) return null;
  try {
    return new URL(tekst.startsWith("http") ? tekst : "https://" + tekst).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Hvor fører linket RIGTIGT hen? E-mailprogrammer pakker links ind i deres egne
// "sikkerhedslinks", så vi pakker dem ud først (kun fra tjenester, vi kender).
function rigtigAdresse(href) {
  const u = new URL(href);
  let indre = null;
  if (u.hostname.endsWith("safelinks.protection.outlook.com")) indre = u.searchParams.get("url");
  else if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === "/url") indre = u.searchParams.get("q") || u.searchParams.get("url");
  else if (u.hostname === "l.facebook.com" || u.hostname === "lm.facebook.com") indre = u.searchParams.get("u");
  if (indre && indre.startsWith("http")) {
    try { return new URL(indre); } catch { /* brug det ydre link */ }
  }
  return u;
}

function fremhaevLinks() {
  for (const link of document.querySelectorAll("a[href]")) {
    if (tjekkedeLinks.has(link)) continue;          // hvert link tjekkes kun én gang
    tjekkedeLinks.add(link);
    if (!link.href.startsWith("http")) continue;

    // 1) Røde links: rød ramme
    const svar = checkLink(link.href);
    if (svar && svar.point >= 3) {
      link.style.outline = "2px solid #d93025";
      link.style.outlineOffset = "2px";
      link.title = t("linkRoedTitel", "⛔ Phishing Tjek: sandsynligvis phishing") + "\n" + svar.grunde.join("\n");
    }

    // 2) Teksten siger én adresse, men linket går til en anden
    const vist = tekstensDomaene(link.textContent);
    if (!vist) continue;
    let rigtig;
    try { rigtig = rigtigAdresse(link.href).hostname.toLowerCase().replace(/^www\./, ""); } catch { continue; }
    const passer = rigtig === vist || rigtig.endsWith("." + vist);
    if (passer) continue;

    if (!(svar && svar.point >= 3)) {                // røde links beholder den røde ramme
      link.style.outline = "2px dashed #e8710a";
      link.style.outlineOffset = "2px";
    }
    link.title = (link.title ? link.title + "\n" : "") + t("uoverensTitel", "⚠ Phishing Tjek: Teksten viser {1}, men linket går til {2}", vist, rigtig);

    // Spørg, før linket åbnes
    link.addEventListener("click", (event) => {
      taelOp("uoverens");
      const ok = confirm(t("uoverensSpoerg",
        "Pas på! Linket siger {1}, men fører i virkeligheden til {2}.\n\nDet er et almindeligt phishing-trick. Vil du åbne det alligevel?",
        vist, rigtig));
      if (!ok) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }
}

fremhaevLinks();

// Hold øje med links, der dukker op senere, f.eks. når man scroller
let venter = false;
new MutationObserver(() => {
  if (venter) return;
  venter = true;
  setTimeout(() => {
    venter = false;
    fremhaevLinks();
  }, 500);
}).observe(document.body, { childList: true, subtree: true });
