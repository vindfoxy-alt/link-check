// Chrome henter checks.js her. Firefox henter den selv via "scripts" i manifest.json
if (typeof importScripts === "function") importScripts("checks.js");

// 0) Højreklik-menu: "Tjek dette link med Phishing Tjek"
// Firefox på mobil har ingen højreklik-menu (contextMenus findes ikke), så vi tjekker først.
function lavMenu() {
  if (!api.contextMenus) return;
  api.contextMenus.removeAll().then(() => {
    api.contextMenus.create({
      id: "tjekLink",
      title: t("menuTjek", "Tjek dette link med Phishing Tjek"),
      contexts: ["link"]                    // vises kun, når man højreklikker på et link
    });
  });
}
api.runtime.onInstalled.addListener(lavMenu);
api.runtime.onStartup.addListener(lavMenu);

if (api.contextMenus) {
  api.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId !== "tjekLink") return;
    // Åbn et lille vindue med resultatet. Linket selv bliver IKKE åbnet.
    api.windows.create({
      url: api.runtime.getURL("tjek.html") + "?url=" + encodeURIComponent(info.linkUrl),
      type: "popup",
      width: 460,
      height: 520
    });
  });
}

// Mine egne GitHub Pages-sider står på listen "Sider, du stoler på" fra starten.
// Det sker kun én gang, så hvis brugeren fjerner siden under Indstillinger, kommer den ikke igen.
const standardBetroede = ["vindfoxy-alt.github.io"];
api.runtime.onInstalled.addListener(async () => {
  const gemt = await api.storage.local.get({ betroedeSider: [], standardTilfoejet: false });
  if (gemt.standardTilfoejet) return;
  for (const side of standardBetroede) {
    if (!gemt.betroedeSider.includes(side)) gemt.betroedeSider.push(side);
  }
  await api.storage.local.set({ betroedeSider: gemt.betroedeSider, standardTilfoejet: true });
});

// 1) Badge på ikonet (som før)
api.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url) return;
  if (!changeInfo.url.startsWith("http")) return;

  const svar = checkLink(changeInfo.url);
  const betroet = await erBetroet(new URL(changeInfo.url).hostname);

  if (svar === null || svar.point === 0 || (svar.point < 3 && betroet)) {
    api.action.setBadgeText({ tabId: tabId, text: "" });
  } else if (svar.point >= 3) {
    api.action.setBadgeText({ tabId: tabId, text: "!" });
    api.action.setBadgeBackgroundColor({ tabId: tabId, color: "#d93025" });
  } else {
    api.action.setBadgeText({ tabId: tabId, text: "?" });
    api.action.setBadgeBackgroundColor({ tabId: tabId, color: "#f9ab00" });
  }
});

// 2) Advarselsside, før en farlig side åbner
api.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;               // kun selve siden, ikke reklamer og iframes
  if (!details.url.startsWith("http")) return;

  const svar = checkLink(details.url);
  if (svar === null) return;

  // Spørg Google, hvis siden ikke allerede er rød
  let google = false;
  if (svar.point < 3) {
    google = (await tjekSafeBrowsing(details.url)) === true;
  }

  if (svar.point === 0 && !google) return;          // sikre sider får ingen advarsel

  // Gule sider, brugeren selv har valgt at stole på, får ingen advarsel. Røde får altid.
  const host = new URL(details.url).hostname;
  if (svar.point < 3 && !google && await erBetroet(host)) return;

  // Gule sider får kun en advarsel, hvis brugeren har slået det til
  if (svar.point < 3 && !google) {
    const indstillinger = await api.storage.sync.get({ gulAdvarsel: false });
    if (!indstillinger.gulAdvarsel) return;
  }

  // Har brugeren allerede valgt "Fortsæt alligevel" for denne side?
  const gemt = await api.storage.session.get("tilladte");
  const tilladte = gemt.tilladte || [];
  if (tilladte.includes(host)) return;

  if (google) {
    api.action.setBadgeText({ tabId: details.tabId, text: "!" });
    api.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#d93025" });
  }

  taelOp(svar.point >= 3 || google ? "roed" : "gul");     // statistik

  const advarsel = api.runtime.getURL("advarsel.html") + "?url=" + encodeURIComponent(details.url) + (google ? "&google=1" : "");
  api.tabs.update(details.tabId, { url: advarsel });
});

// 3) Lille gul boks på siden, når gul advarsel er slået fra
api.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (!details.url.startsWith("http")) return;

  const svar = checkLink(details.url);
  if (svar === null || svar.point === 0 || svar.point >= 3) return;  // kun gule sider

  // Er den store gule advarsel slået til, får brugeren den i stedet
  const indstillinger = await api.storage.sync.get({ gulAdvarsel: false });
  if (indstillinger.gulAdvarsel) return;

  // Har brugeren selv valgt at stole på siden?
  const host = new URL(details.url).hostname;
  if (await erBetroet(host)) return;

  taelOp("gul");   // statistik

  // Teksterne oversættes her, fordi visGulBoks kører inde på siden og ikke kan bruge t()
  const tekster = {
    titel: t("boksTitel", "⚠️ Vær forsigtig på denne side"),
    intro: t("boksIntro", "Phishing Tjek har fundet nogle advarselstegn:"),
    hvorfor: t("hvorforLink", "Hvorfor er det farligt? →"),
    stol: t("stolKnap", "Jeg stoler på denne side"),
    luk: t("luk", "Luk")
  };

  api.scripting.executeScript({
    target: { tabId: details.tabId },
    func: visGulBoks,
    args: [svar.grunde, host, tekster]
  });
});

// Denne funktion kører INDE på hjemmesiden, ikke i baggrunden
function visGulBoks(grunde, host, tekster) {
  if (document.getElementById("phishing-tjek-boks")) return;   // vis den kun én gang

  const vaert = document.createElement("div");
  vaert.id = "phishing-tjek-boks";
  const skygge = vaert.attachShadow({ mode: "open" });   // siden kan ikke ændre boksens udseende

  skygge.innerHTML = `
    <style>
      .boks {
        position: fixed; top: 16px; right: 16px; z-index: 2147483647;
        width: 300px; padding: 14px 16px; border-radius: 10px;
        background: #fff3cd; color: #4a3500; border: 1px solid #e0c060;
        font: 14px/1.4 "Segoe UI", Arial, sans-serif;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }
      b { display: block; margin-bottom: 4px; }
      ul { margin: 6px 0 0; padding-left: 18px; font-size: 13px; }
      a { display: inline-block; margin-top: 8px; font-size: 13px; color: #4a3500; font-weight: 600; }
      .stol {
        position: static; display: block; margin-top: 10px; padding: 6px 10px;
        border: 1px solid #4a3500; border-radius: 6px; font-size: 13px;
      }
      button {
        position: absolute; top: 6px; right: 8px;
        border: none; background: none; font-size: 18px; cursor: pointer; color: #4a3500;
      }
    </style>
    <div class="boks">
      <button class="luk">×</button>
      <b></b>
      <span class="intro"></span>
      <ul></ul>
      <a href="https://vindfoxy-alt.github.io/link-check/hvorfor.html" target="_blank"></a>
      <button class="stol"></button>
    </div>`;

  // Sæt teksterne ind med textContent (så de aldrig kan blive til kode)
  skygge.querySelector(".luk").title = tekster.luk;
  skygge.querySelector("b").textContent = tekster.titel;
  skygge.querySelector(".intro").textContent = tekster.intro;
  skygge.querySelector("a").textContent = tekster.hvorfor;
  skygge.querySelector(".stol").textContent = tekster.stol;

  const liste = skygge.querySelector("ul");
  for (const grund of grunde) {
    const punkt = document.createElement("li");
    punkt.textContent = grund;
    liste.appendChild(punkt);
  }

  skygge.querySelector(".luk").addEventListener("click", () => vaert.remove());

  // "Jeg stoler på denne side": gem siden på brugerens egen liste, og luk boksen
  skygge.querySelector(".stol").addEventListener("click", async () => {
    const ext = globalThis.browser ?? globalThis.chrome;
    const ren = host.toLowerCase().replace(/^www\./, "");
    const gemt = await ext.storage.local.get({ betroedeSider: [] });
    if (!gemt.betroedeSider.includes(ren)) gemt.betroedeSider.push(ren);
    await ext.storage.local.set({ betroedeSider: gemt.betroedeSider });
    vaert.remove();
  });
  setTimeout(() => vaert.remove(), 10000);   // forsvinder af sig selv efter 10 sekunder
  document.body.appendChild(vaert);
}
