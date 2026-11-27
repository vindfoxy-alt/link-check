<p align="center">
  <img src="icons/logo.svg" width="128" alt="Link Check logo">
</p>

# link-check

Browser extension that checks links for phishing. Paste a link, and it tells you whether it looks safe, suspicious or dangerous, and why.

**Try it online without installing:** [vindfoxy-alt.github.io/link-check](https://vindfoxy-alt.github.io/link-check/)

<p align="center">
  <a href="https://github.com/vindfoxy-alt/link-check/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/Download-Extension-1a9ec2?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download the extension">
  </a>
</p>

## Installation

1. Click **Download Extension** above and unzip the file.
2. Open Chrome and go to `chrome://extensions` (in Edge: `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and choose the unzipped `link-check-main` folder.
5. Click the puzzle icon next to the address bar and pin **Phishing Tjek**.

### Firefox

1. Download [phishing-tjek-firefox.zip](dist/phishing-tjek-firefox.zip). No need to unzip it.
2. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Choose the downloaded `phishing-tjek-firefox.zip`.
4. If short links or red link frames do not work, open **Add-ons and themes** → **Phishing Tjek** → **Permissions**, and allow access to all websites.

A temporary add-on is removed when Firefox closes, so repeat this next time. Installing it permanently requires Mozilla to sign it.

## Features

- **Check any link:** click the cube icon, paste a link and press **Tjek link**.
- **Automatic checks:** every page you open is checked in the background. A red **!** or yellow **?** badge appears on the icon.
- **Warning pages:** dangerous sites show a warning before they open, with the reasons and a choice to go back or continue.
- **Short links:** for bit.ly, tinyurl and similar, it finds out where the link really leads and checks that too.
- **Stop sign:** dangerous (red) pages always show a warning with a stop sign.
- **Your choice for yellow pages:** in **⚙ Indstillinger** you choose between a full warning page or a small yellow box in the corner.
- **Test site:** try it all on the [test page](https://vindfoxy-alt.github.io/link-check/), linked from the popup.
- **Right-click check:** right-click any link → **Tjek dette link med Phishing Tjek** to check it without opening it. Short links show where they really lead.
- **Fake link texts:** a link whose text says one address but goes to another gets an orange frame, and asks before it opens.
- **QR codes:** paste, drop or choose a picture of a QR code, and the link inside is checked before you open it.
- **Trust button and Meld til IT:** mark yellow sites you trust, and send a ready-written report to your IT support.
- **Password warning:** a blue box appears when an unknown site asks for your password.
- **Statistics:** see how many times Phishing Tjek has warned you, per month and in total.
- **English:** the extension is in English in browsers that are not set to Danish.
- **Phishing quiz:** test yourself on the [quiz page](https://vindfoxy-alt.github.io/link-check/quiz.html).

Works in Chrome, Edge, Brave, Opera, Vivaldi and Firefox (140 or newer).

## How to use it

Click the cube icon, paste a link and press **Tjek link**:

- 🟢 **Looks safe:** no warning signs found
- 🟡 **Be careful:** one or two warning signs
- 🔴 **Probably phishing:** several warning signs, don't open the link

## Privacy

The extension reads the address of the pages you visit, and looks up where short links lead. All checks happen on your own computer. Your settings, the sites you trust and the statistics are only saved in your own browser, and nothing is sent to us or anyone else. The only exception is Google Safe Browsing: it is off by default, and if you turn it on with your own key, the addresses of pages you open are sent to Google.

## Credits

Made by **[vindfoxy-alt](https://github.com/vindfoxy-alt)** as an innovation project in IT support education.

QR codes are read with [jsQR](https://github.com/cozmo/jsQR) (Apache License 2.0).
