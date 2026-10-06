# Kaalchakra 2.0 website

Static site for Kaalchakra CTF 2.0 (NFSU Goa × TH3_RANG3RS). No build step: push the folder to a GitHub repository and turn on GitHub Pages (Settings → Pages → Deploy from branch → `main` / root). `index.html` is the home page.

| Page | File | What it is |
| --- | --- | --- |
| Kaalchakra 2.0 | `index.html` | The new event. The most cinematic page. |
| Hall of Legends | `logbook.html` | The 2026 edition: champions, leaderboards, prizes, sponsors. An archive, so it stays calm. |
| The crew | `crew.html` | The ship's registry: faculty, the core four, and eight new organisers. |

## Editing content

Almost everything lives in **`assets/data.js`**. Every page reads from `window.KC`; nothing is hard-coded twice.

Search the file for `TODO`. Each one is a placeholder waiting for a real detail:

- `event.qualifierStart`, `event.finalsDate`: ISO dates in IST. While they are `null`, the site says "announced soon".
- `event.registrationOpen` and `event.registerUrl`: set both when the form goes live. The hero button then switches from "Get registration alerts" (Discord) to "Register your crew".
- `event.fee` and `event.sponsorEmail`.
- `newCrew`: the eight new organisers. Replace each placeholder with `{ name, role, line, linkedin }`. Add `photo: "assets/crew/name.jpg"` to show a portrait.
- `links`: Discord, Instagram, LinkedIn, X and the CTFtime pages.
- `captain` and `pirates`: every line the characters say. Edit freely.

The 2026 results under `past` are copied from CTFtime. Don't edit them unless CTFtime changes.

## The logo

`assets/brand/` holds the original Kaalchakra CTF logo, unmodified. The smaller files are straight resizes of the same image (PNG plus lossless WebP):

- the header uses the 128 px file;
- the hero uses the 480 px file and the full-size file;
- the footer uses the 256 px file;
- the favicon and Apple touch icon are also resizes.

To replace the logo, overwrite these files with the same names.

## How the world works

Everything is drawn in the browser with three.js r128, loaded from cdnjs. No models, textures or sounds are downloaded.

| Module | File | Job |
| --- | --- | --- |
| WorldState | `assets/js/core/world-state.js` | Shared clock, event bus, Danger Mode values (danger, fog, rain, lightning, shake), shared lighting. Sets the CSS variables `--danger` and `--flash`. |
| AudioManager | `assets/js/core/audio.js` | Synthesised sound effects and sea ambience. Off by default and quiet when on. |
| AmbientWorld | `assets/js/world/environment.js` (+ `ship.js`, `textures.js`) | Ocean shader, sky, clouds, weather, islands, gulls, the Kaalnaav and the raider ship, and a camera path per page. |
| PirateCharacter, PirateEnemy | `assets/js/characters/rig.js`, `poses.js`, `roster.js` | Procedural rigged characters, the pose library, and the cast (Captain Kaal plus six rivals). |
| MovementController | `assets/js/stage/movement.js` | Characters walk on the bottom of the screen and stand on any element marked `data-perch`. They also jump, climb, slide, fall and hide behind `data-solid` blocks. |
| Stage | `assets/js/stage/stage.js` | The transparent character layer, particles, smoke, fog, coins, the chest, ropes and speech bubbles. |
| CinematicEventManager, DangerMode | `assets/js/stage/events.js` | Events A–G (see below), the captain's idle life, and the calm → danger → calm pacing. |
| InteractionManager | `assets/js/stage/interaction.js` | Cursor look, clicks (and annoyance), fast-scroll reaction, flag cheers, pointing at the CTA and Discord, FAQ answers, crew introductions. |
| HUD | `assets/js/ui/hud.js` | Doubloons, hidden-flag count, Talk, Sound on/off, Hide captain. |
| Page logic | `assets/js/site.js` | Navigation, registration state, category cards, FAQ, leaderboards and search, prizes, sponsors, crew cards. |

### Cinematic events

There is one event at a time, with long calm gaps between them. Home runs all seven; the Hall of Legends and Crew pages only run the mild ones (B, D, G).

| | Event | What happens |
| --- | --- | --- |
| A | Arrive | A raider ship appears on the horizon, the sky darkens, and a rival pirate comes aboard. |
| B | Chase | Two pirates chase Kaal across the page. He escapes over cards or into fog. |
| C | Capture | He is cornered: "Give us the flags!". He talks his way out, then fights. |
| D | Flag raid | A pirate steals one of the hidden flags and Kaal wins it back. |
| E | Dark sea | Storm, rain, lightning and fog, then a duel. |
| F | Boarding | The raider ship comes alongside, a boarding party swings over, and Kaal holds the deck. |
| G | Treasure | He digs up a chest and doubloons spill out. Also triggered by clicking the chest on the home page. |

### Accessibility and performance

- Reduced motion: no events and no ambient wandering. The captain stands still and only speaks when spoken to. There are no flashes or shake.
- Characters render behind text and cards. The captain is clickable only where nothing else is under the pointer.
- Everything he says also goes to a polite live region.
- Phones get at most two enemies (four on desktop), shorter and rarer events, a smaller world resolution, and the HUD in the header bar.
- Without WebGL, the pages fall back to a painted dusk background and everything else still works.
- The world pauses when the tab is hidden, and the rendering resolution adapts to frame rate.

## Assets you can add (optional)

- **Sound files**: put files in `assets/audio/` and list them in `KC.audio.files` in `data.js`, for example `{ clash: "assets/audio/clash.mp3", cannon: "assets/audio/cannon.mp3" }`. The names you can use are clash, hit, whoosh, step, pistol, cannon, thunder, treasure, arrive and creak. Any name you leave out keeps its synthesised sound. Use short, quiet, licensed clips.
- **Crew photos**: square JPGs, at least 160 px, referenced from `data.js`.
- **2.0 sponsor logos or prize details**: add these once confirmed. The site doesn't invent any.

## Hidden flags

There are 8 hidden flag buttons (`.flag-egg`): 5 on the home page, 2 on the Hall of Legends and 1 on the crew page. If you add or remove one, update `KC.totalFlags`. Progress is saved per visitor in the browser.
