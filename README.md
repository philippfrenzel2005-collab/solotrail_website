# SoloTrail Website

Static website prototype for the SoloTrail hiking tracker concept.

This repository is intentionally simple: plain HTML, CSS and JavaScript so the
site can be edited quickly and hosted on GitHub Pages or any static web host.

## Project Structure

```text
.
|-- assets/
|   |-- css/
|   |   `-- styles.css
|   |-- images/
|   `-- js/
|       `-- main.js
|-- googleea559fdab5c7b9f2.html
|-- index.html
`-- README.md
```

## Local Preview

Open `index.html` directly in a browser, or run a small local server:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Notes

- Keep the tone honest: SoloTrail is an early-stage technical prototype, not a finished commercial product.
- Put styles in `assets/css/styles.css`.
- Put small interactions in `assets/js/main.js`.
- Put website images in `assets/images/`.
- Keep the Google verification HTML file in the repository root if it is still needed for Search Console.
