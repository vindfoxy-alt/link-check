// Højreklik-vinduet: hent linket fra adressen (?url=...) og tjek det
const linkFraMenu = new URLSearchParams(location.search).get("url");

document.getElementById("adresse").textContent = linkFraMenu;
tjekOgVis(linkFraMenu, document.getElementById("resultat"));

document.getElementById("luk").addEventListener("click", () => window.close());
