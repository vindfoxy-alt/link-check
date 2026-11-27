// Advar, når en side, der ikke er kendt og sikker, beder om en adgangskode.
// Kører inde på hver side, du åbner.
let adgangskodeVist = false;

async function tjekAdgangskode() {
  if (adgangskodeVist) return;
  if (!document.querySelector('input[type="password"]')) return;   // ingen adgangskodefelt

  const host = location.hostname.toLowerCase();
  const kendt = sikreDomaener.some(d => host === d || host.endsWith("." + d));
  if (kendt || await erBetroet(host)) return;

  adgangskodeVist = true;
  taelOp("adgangskode");   // statistik
  visAdgangskodeBoks(host.replace(/^www\./, ""));
}

function visAdgangskodeBoks(host) {
  const vaert = document.createElement("div");
  const skygge = vaert.attachShadow({ mode: "open" });   // siden kan ikke ændre boksens udseende

  skygge.innerHTML = `
    <style>
      .boks {
        position: fixed; top: 16px; right: 16px; z-index: 2147483647;
        width: 320px; padding: 14px 16px; border-radius: 10px;
        background: #e8f1fd; color: #0b3a6e; border: 1px solid #9cc0ef;
        font: 14px/1.4 "Segoe UI", Arial, sans-serif;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }
      b { display: block; margin-bottom: 4px; }
      .adresse { font-family: Consolas, monospace; font-weight: 700; word-break: break-all; }
      .luk {
        position: absolute; top: 6px; right: 8px;
        border: none; background: none; font-size: 18px; cursor: pointer; color: #0b3a6e;
      }
      .stol {
        margin-top: 10px; padding: 6px 10px; cursor: pointer;
        border: 1px solid #0b3a6e; border-radius: 6px; background: transparent; color: #0b3a6e; font-size: 13px;
      }
      a { display: inline-block; margin-top: 8px; font-size: 13px; color: #0b3a6e; font-weight: 600; }
    </style>
    <div class="boks">
      <button class="luk">×</button>
      <b></b>
      <span class="tjek"></span> <span class="adresse"></span><br>
      <span class="raad"></span>
      <br><a href="https://vindfoxy-alt.github.io/link-check/hvorfor.html" target="_blank"></a>
      <br><button class="stol"></button>
    </div>`;

  // Teksterne sættes ind med textContent og oversættes med t()
  skygge.querySelector(".luk").title = t("luk", "Luk");
  skygge.querySelector("b").textContent = t("kodeTitel", "🔑 Denne side beder om din adgangskode");
  skygge.querySelector(".tjek").textContent = t("kodeTjek", "Tjek adressen:");
  skygge.querySelector(".raad").textContent = t("kodeRaad",
    "Er det den rigtige side? Indtast kun din adgangskode, hvis du selv har skrevet adressen eller brugt et bogmærke.");
  skygge.querySelector("a").textContent = t("hvorforKort", "Hvorfor? →");
  skygge.querySelector(".stol").textContent = t("stolKnap", "Jeg stoler på denne side");

  skygge.querySelector(".adresse").textContent = host;
  skygge.querySelector(".luk").addEventListener("click", () => vaert.remove());
  skygge.querySelector(".stol").addEventListener("click", async () => {
    await stolPaa(host);
    vaert.remove();
  });

  document.body.appendChild(vaert);
}

tjekAdgangskode();

// Nogle sider viser først adgangskodefeltet senere, f.eks. efter man har skrevet sin e-mail
let venterAdgangskode = false;
new MutationObserver(() => {
  if (venterAdgangskode || adgangskodeVist) return;
  venterAdgangskode = true;
  setTimeout(() => {
    venterAdgangskode = false;
    tjekAdgangskode();
  }, 1000);
}).observe(document.body, { childList: true, subtree: true });
