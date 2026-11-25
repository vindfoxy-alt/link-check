// Chrome henter checks.js her. Firefox henter den selv via "scripts" i manifest.json
if (typeof importScripts === "function") importScripts("checks.js");

// 1) Badge på ikonet (som før)
api.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;
  if (!changeInfo.url.startsWith("http")) return;

  const svar = checkLink(changeInfo.url);

  if (svar === null || svar.point === 0) {
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

  // Gule sider får kun en advarsel, hvis brugeren har slået det til
  if (svar.point < 3 && !google) {
    const indstillinger = await api.storage.sync.get({ gulAdvarsel: false });
    if (!indstillinger.gulAdvarsel) return;
  }

  // Har brugeren allerede valgt "Fortsæt alligevel" for denne side?
  const host = new URL(details.url).hostname;
  const gemt = await api.storage.session.get("tilladte");
  const tilladte = gemt.tilladte || [];
  if (tilladte.includes(host)) return;

  if (google) {
    api.action.setBadgeText({ tabId: details.tabId, text: "!" });
    api.action.setBadgeBackgroundColor({ tabId: details.tabId, color: "#d93025" });
  }

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

  api.scripting.executeScript({
    target: { tabId: details.tabId },
    func: visGulBoks,
    args: [svar.grunde]
  });
});

// Denne funktion kører INDE på hjemmesiden, ikke i baggrunden
function visGulBoks(grunde) {
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
      button {
        position: absolute; top: 6px; right: 8px;
        border: none; background: none; font-size: 18px; cursor: pointer; color: #4a3500;
      }
    </style>
    <div class="boks">
      <button title="Luk">×</button>
      <b>⚠️ Vær forsigtig på denne side</b>
      Phishing Tjek har fundet nogle advarselstegn:
      <ul></ul>
      <a href="https://vindfoxy-alt.github.io/link-check/hvorfor.html" target="_blank">Hvorfor er det farligt? →</a>
    </div>`;

  const liste = skygge.querySelector("ul");
  for (const grund of grunde) {
    const punkt = document.createElement("li");
    punkt.textContent = grund;
    liste.appendChild(punkt);
  }

  skygge.querySelector("button").addEventListener("click", () => vaert.remove());
  setTimeout(() => vaert.remove(), 10000);   // forsvinder af sig selv efter 10 sekunder
  document.body.appendChild(vaert);
}
