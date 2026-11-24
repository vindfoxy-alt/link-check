importScripts("checks.js");

// 1) Badge på ikonet (som før)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;
  if (!changeInfo.url.startsWith("http")) return;

  const svar = checkLink(changeInfo.url);

  if (svar === null || svar.point === 0) {
    chrome.action.setBadgeText({ tabId: tabId, text: "" });
  } else if (svar.point >= 3) {
    chrome.action.setBadgeText({ tabId: tabId, text: "!" });
    chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#d93025" });
  } else {
    chrome.action.setBadgeText({ tabId: tabId, text: "?" });
    chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#f9ab00" });
  }
});

// 2) Advarselsside, før en farlig side åbner
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;               // kun selve siden, ikke reklamer og iframes
  if (!details.url.startsWith("http")) return;

  const svar = checkLink(details.url);
  if (svar === null || svar.point === 0) return;   // røde og gule sider får en advarsel

  // Har brugeren allerede valgt "Fortsæt alligevel" for denne side?
  const host = new URL(details.url).hostname;
  const gemt = await chrome.storage.session.get("tilladte");
  const tilladte = gemt.tilladte || [];
  if (tilladte.includes(host)) return;

  const advarsel = chrome.runtime.getURL("advarsel.html") + "?url=" + encodeURIComponent(details.url);
  chrome.tabs.update(details.tabId, { url: advarsel });
});
