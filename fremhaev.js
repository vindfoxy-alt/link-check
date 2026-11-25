// Fremhæv farlige links på siden. Kører inde på hver side, du åbner.
const tjekkedeLinks = new WeakSet();

function fremhaevLinks() {
  for (const link of document.querySelectorAll("a[href]")) {
    if (tjekkedeLinks.has(link)) continue;          // hvert link tjekkes kun én gang
    tjekkedeLinks.add(link);
    if (!link.href.startsWith("http")) continue;

    const svar = checkLink(link.href);
    if (!svar || svar.point < 3) continue;          // kun røde links fremhæves

    link.style.outline = "2px solid #d93025";
    link.style.outlineOffset = "2px";
    link.title = "⛔ Phishing Tjek: sandsynligvis phishing\n" + svar.grunde.join("\n");
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
