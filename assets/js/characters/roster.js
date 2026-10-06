/* Kaalchakra 2.0 — the cast. Captain Kaal (original design) and six rival pirates.
   Each entry: rig style + behaviour traits used by the stage (speed, weapon, attack style, lines). */
(function () {
  "use strict";
  const CAPTAIN = {
    id: "captain", name: "Captain Kaal", style: "captain",
    rig: {
      skin: "#b07a54", eye: "#3a2414",
      hair: "#24170f", hairStyle: "tied", beard: "full", beardColor: "#24170f",
      hat: "tricorn", hatColor: "#1f1610", hatTrim: "#b08a3c", badge: true,
      shirt: "#e7dcc4", vest: "#5e1d1f",
      coat: { color: "#1d3647", lining: "#b9925a", length: "long", trim: "#c9a24a" },
      sash: "#d27d2c", baldric: true, spyglass: true, compass: true,
      trousers: "#2f2721", boots: "#3a2416", bootStyle: "tall",
      weapon: "cutlass", build: { w: 1, h: 1, belly: 0, limb: 1 }
    },
    walk: 1.3, run: 3.4, weapon: "cutlass"
  };

  const PIRATES = [
    { id: "brute", name: "Hullbreaker", weapon: "greatsword", walk: 1.0, run: 2.6, hp: 3, attack: "overhead",
      rig: { skin: "#8a5838", hairStyle: "bald", beard: "full", beardColor: "#3a2516", hat: "bandana", hatColor: "#6e2a22", shirt: "#4a3a2c", vest: "#4a2e1a", sleeves: "bare", sash: "#3a2a20", trousers: "#463a2c", boots: "#2b1c12", earring: true, build: { w: 1.32, h: 1.02, belly: 1, limb: 1.02 } } },
    { id: "gunner", name: "Quickpowder", weapon: "pistol", walk: 1.5, run: 4.2, hp: 1, attack: "shoot",
      rig: { skin: "#c49470", hair: "#4a2c18", hairStyle: "short", beard: "thin", hat: "bandana", hatColor: "#2f5a3a", shirt: "#d8cfb8", coat: { color: "#7a2f22", lining: "#3a1a14", length: "hip", cuff: true }, trousers: "#3d3a30", boots: "#2a1a10", bootStyle: "short", build: { w: 0.9, h: 0.98, belly: 0, limb: 1 } } },
    { id: "longcoat", name: "Grey Mourner", weapon: "rapier", walk: 1.2, run: 3.2, hp: 2, attack: "thrust",
      rig: { skin: "#d6b7a0", hair: "#9a9590", hairStyle: "long", beard: "goatee", beardColor: "#8a8580", hat: "widebrim", hatColor: "#151519", feather: "#8c8a86", shirt: "#cfc6b4", coat: { color: "#16171c", lining: "#4a1a20", length: "ankle", trim: "#7d7f86" }, trousers: "#1e1d22", boots: "#141414", build: { w: 0.92, h: 1.12, belly: 0, limb: 1.06 } } },
    { id: "masked", name: "the Shade", weapon: "dagger", dual: true, walk: 1.5, run: 4.4, hp: 1, attack: "slash",
      rig: { skin: "#a87a58", eye: "#6b5a2a", hair: "#121212", hairStyle: "short", beard: "none", hat: "hood", hatColor: "#33263f", mask: "#24192e", shirt: "#3b2f48", vest: "#2a2034", trousers: "#231b2b", boots: "#171217", belt: true, collar: false, build: { w: 0.94, h: 1.0, belly: 0, limb: 1 } } },
    { id: "boarder", name: "Hookline", weapon: "axe", walk: 1.3, run: 3.8, hp: 2, attack: "overhead",
      rig: { skin: "#9c6a46", hair: "#2e2018", hairStyle: "short", beard: "stubble", hat: "cap", hatColor: "#8a2b2b", shirtTex: "stripes", sleeves: "rolled", sash: "#20314f", trousers: "#5a4a36", boots: "#2b1c12", bootStyle: "short", earring: true, build: { w: 1.12, h: 1.0, belly: 0.2, limb: 1 } } },
    { id: "barnacle", name: "Barnacle Bill", weapon: "bomb", walk: 1.0, run: 2.8, hp: 1, attack: "throw",
      rig: { skin: "#d49a7a", hair: "#b5562b", hairStyle: "short", beard: "moustache", beardColor: "#b5562b", hat: "bicorne", hatColor: "#2a1c14", hatTrim: "#c9a24a", feather: "#d8d2c4", shirt: "#e0d6c0", vest: "#2f4a3a", trousers: "#5a3a26", boots: "#2b1c12", bootStyle: "short", pegLeg: "R", build: { w: 1.22, h: 0.86, belly: 1, limb: 0.92 } } }
  ];

  window.KCRoster = { CAPTAIN, PIRATES };
})();
