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

1. Click **Download Extension** above and unzip the file.
2. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Choose the `manifest.json` file in the unzipped folder.
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

Works in Chrome, Edge, Brave, Opera, Vivaldi and Firefox (121 or newer).

## How to use it

Click the cube icon, paste a link and press **Tjek link**:

- 🟢 **Looks safe:** no warning signs found
- 🟡 **Be careful:** one or two warning signs
- 🔴 **Probably phishing:** several warning signs, don't open the link

## Privacy

The extension reads the address of the pages you visit, and looks up where short links lead. All checks happen on your own computer. Nothing is saved, and nothing is sent to us or anyone else.
