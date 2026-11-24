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

## How to use it

Click the cube icon, paste a link and press **Tjek link**:

- 🟢 **Looks safe:** no warning signs found
- 🟡 **Be careful:** one or two warning signs
- 🔴 **Probably phishing:** several warning signs, don't open the link
