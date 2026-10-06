/* Kaalchakra CTF — site data.
   Edit this file to update the site. Every page reads from window.KC.
   Anything marked TODO is a placeholder waiting for real details. */
window.KC = {
  event: {
    name: "Kaalchakra 2.0",
    // TODO: set ISO dates (IST) when announced, e.g. "2027-03-20T14:30:00+05:30".
    // While null, the site shows "Announced soon" instead of a countdown.
    qualifierStart: null,
    finalsDate: null,
    registrationOpen: false,          // TODO: true when the form goes live
    registerUrl: "",                  // TODO: registration form URL for 2.0
    fee: "To be confirmed",           // TODO: e.g. "₹300 per crew"
    teamSize: "1–3 members",
    finalsVenue: "NFSU Goa campus",
    sponsorEmail: ""                  // TODO: e.g. "sponsors@kaalchakractf.com"
  },

  links: {
    discord: "https://discord.gg/q4Pam5h3Bd",
    instagram: "https://instagram.com/kaalchakra_ctf",
    linkedin: "https://linkedin.com/in/kaalchakra-ctf",
    x: "https://twitter.com/KaalChakra_CTF",
    ctftime: "https://ctftime.org/ctf/1530/",
    ctftimeQuals2026: "https://ctftime.org/event/3183",
    ctftimeFinals2026: "https://ctftime.org/event/3230"
  },

  /* The eight spokes of the wheel = challenge categories for 2.0 */
  seas: [
    { sea: "The Web Harbour", cat: "Web exploitation", glyph: "W",
      text: "A port full of busy, badly built websites. Find the injection, slip past the login, turn the server against itself.",
      skills: ["SQLi and XSS", "Auth bypass", "SSRF", "Logic bugs"] },
    { sea: "Cipher Straits", cat: "Cryptography", glyph: "C",
      text: "Narrow water guarded by ciphers. Some are older than the ship; some are modern schemes used carelessly.",
      skills: ["Classical ciphers", "RSA mistakes", "XOR and padding", "Hashes"] },
    { sea: "Wreck Reef", cat: "Forensics", glyph: "F",
      text: "Sunken evidence waiting to be salvaged: memory dumps, disk images, packet captures and files that are not what they seem.",
      skills: ["Memory analysis", "PCAP", "Disk images", "Steganography"] },
    { sea: "Clockwork Depths", cat: "Reverse engineering", glyph: "R",
      text: "Compiled binaries ticking in the dark. Take them apart until the logic, and the flag, falls out.",
      skills: ["Assembly", "Decompilers", "Anti-debugging", "Crackmes"] },
    { sea: "Lookout's Nest", cat: "OSINT", glyph: "O",
      text: "Climb the mast and read the horizon. Every flag here is out in the open for anyone who knows where to look.",
      skills: ["Geolocation", "Account tracing", "Metadata", "Archives"] },
    { sea: "Siren Shoals", cat: "AI / ML security", glyph: "A",
      text: "Models that sing back whatever they are told. Talk them into giving up what they guard.",
      skills: ["Prompt injection", "Jailbreaks", "Model inversion", "Data poisoning"] },
    { sea: "The Cannon Deck", cat: "Binary exploitation", glyph: "P",
      text: "Load the right bytes, aim at the stack, and fire. Memory corruption challenges for crews who like a bang.",
      skills: ["Buffer overflows", "ROP", "Format strings", "Heap basics"] },
    { sea: "Uncharted Waters", cat: "Miscellaneous", glyph: "M",
      text: "Everything that refuses to sit on a chart: puzzles, jails, scripting races and the occasional sea shanty.",
      skills: ["Pyjails", "Scripting", "Esoteric languages", "Puzzles"] }
  ],

  faq: [
    { q: "Who can take part?",
      a: "Undergraduate and postgraduate students enrolled at a recognised Indian institution. Every crew member needs a valid college ID." },
    { q: "How big can a crew be?",
      a: "One to three members. Each person can be part of only one crew, and crews can't swap members after registration." },
    { q: "Is there an entry fee?",
      a: "In 2026 the fee was ₹300 per crew. The fee for 2.0 will be confirmed when registration opens." },
    { q: "Do we have to travel for the qualifier?",
      a: "No. The qualifier is a 24-hour online Jeopardy CTF you can play from anywhere. Only the finals are held in person at NFSU Goa." },
    { q: "How are finalists chosen?",
      a: "The top crews on the qualifier scoreboard are shortlisted and must submit write-ups within 8 hours. If a shortlisted crew can't be verified or can't attend, the next crew on the scoreboard is invited." },
    { q: "Are travel and stay covered for the finals?",
      a: "In 2026, finalists arranged their own travel and accommodation. Any change for 2.0 will be announced with the finalist invitations." },
    { q: "Where do we ask questions during the event?",
      a: "On the official Discord server. Open a ticket there instead of messaging organisers directly, so the whole crew of organisers can see it." },
    { q: "Is the event listed on CTFtime?",
      a: "Yes. Both rounds of 2026 were listed on CTFtime, and 2.0 will be listed the same way." }
  ],

  /* ---------- 2026 (Kaalchakra 1.0) ---------- */
  past: {
    stats: { qualTeams: 186, finalTeams: 24, cashTop3: "₹2,00,000" },
    categories: ["Web", "Cryptography", "Forensics", "Reverse engineering", "OSINT", "AI / ML", "Miscellaneous"],
    finals: [
      ["root@void", 7650], ["Cryptonite", 7550], ["ISFCR PESU", 7350], ["z0d1ak", 6850],
      ["BlitzHack", 6170], ["404_GBPIET", 5750], ["Insighters", 5750], ["knockout-club", 5720],
      ["Jarvis", 5350], ["Obfuscat3d0_0C0m3ts", 5150], ["H4CK_077", 4950], ["r00t_R3b3lz", 4150],
      ["noah", 3850], ["0nyX", 3250], ["Flaggers United!", 2850], ["KattangalSec", 2850],
      ["3p1t0m3", 2550], ["ExPloit", 1950], ["Eclipse", 1650], ["Trojan Takedown", 1450],
      ["Gh057", 850], ["Gotham_triad", 350], ["Rooot_Usserrsss", 350], ["Team Targaryen", 50]
    ],
    quals: [
      ["ISFCR PESU",10750],["Cryptonite",10250],["z0d1ak",9850],["root@void",8850],["godsec",8850],
      ["BlitzHack",8530],["Gh057",8350],["Insighters",8150],["404_GBPIET",7950],["Eclipse",7850],
      ["Obfuscat3d0_0C0m3ts",7650],["knockout-club",7250],["Gnomes",7150],["r00t_R3b3lz",6850],["Team Targaryen",6850],
      ["0nyX",6750],["Banshankari Metro Station",6650],["F__S0CI3TY",6650],["KattangalSec",6250],["Nauti",6150],
      ["H4CK_077",5950],["Rooot_Usserrsss",5950],["Abu_b91589",5900],["Flaggers United!",5850],["KV2",5750],
      ["Monopoly",5650],["3p1t0m3",5350],["ExPloit",5150],["Gotham_triad",5050],["Windows 9/11",5050],
      ["Jarvis",4950],["Brahmastra",4750],["Rudra_Root",4650],["Trojan Takedown",4550],["noah",4250],
      ["Trolling Stones",3850],["Draco Cyberforce",3750],["Dysphoria",3650],["Garuda",3550],["Dealers 🐉",3550],
      ["DarkCipher",3550],["Team HackersAPK",3550],["cyberhunters",3250],["Ashura",3250],["Squirtle Squad",3150],
      ["CODE-007",3150],["Invicta",2950],["Bugassassin's",2850],["Naam_Me_Kya_Hai",2850],["RABit",2850],
      ["CTFPAGLUS",2750],["cryptoTa2",2650],["payload_everything",2550],["genZ",2550],["azrael",2550],
      ["GujjuWarriors",2550],["ROOTFORCE",2550],["BAY Hisaab",2450],["Skill Issue 2.0",2450],["GenZCTF",2350],
      ["Shadow root",2350],["Cyber Sphere",2350],["Dimitri_Lip",2250],["Me0w",2250],["system32",2250],
      ["teenage_mutant_ninja_turtles",2250],["Flag🥷Fighters",2250],["Cyberfortix Warriors",2250],["cyber_warriors",2250],["Neurofox",2250],
      ["r4c00ns",2150],["Maxyverse",2150],["Rajmarockets",2050],["rA0n3s",2050],["flaggedIRL",1950],
      ["ReveaLock",1950],["kbd",1950],["IMxDanny",1850],["AlphaX",1850],["[T-1] M1DN1GHT",1850],
      ["Encrypted Chaos",1700],["L4n4 code5",1650],["cook",1650],["Team Hacktatics",1650],["Fall guys",1650],
      ["Flag-Forg",1630],["sudoWin",1550],["cronos",1550],["dragon",1550],["ZeroDayZ",1550],
      ["Sn3kBy7e",1550],["Anurag",1500],["shadowbyte",1450],["Soteria",1450],["LŌOS3R's",1450],
      ["Losers",1450],["Act1x",1450],["Ecohackers",1450],["fsociety_0x65",1450],["C4RAXES",1450],
      ["Akatsuki1",1350],["packetpandas",1350],["The Eagle eye",1350],["D0texe",1250],["Flag Hunters",1250],
      ["0xdeadbeef",1250],["Ep1tome Alpha",1150],["ninja",1150],["LSS",1150],["c0d3",1150],
      ["K_H",1050],["CyberCiphers",1050],["Cyber Dev",1050],["demo0111",950],["Sentinel",950],
      ["Vichar",950],["SmartFang89",950],["La Espada",950],["2>/DEV/Null",900],["BootsFTW",850],
      ["RazorRaptor93",850],["Team PSY",850],["Kavach",850],["Vision-x",750],["kapidhvaj",750],
      ["Hack O'Holics",750],["TechDefenders(The Cyber Security Experts)",650],["V01d",650],["nap",650],["PDA",650],
      ["SPY Verse",650],["PENXCESS",650],["NightHawks",650],["Cipher_squad",650],["D!g!t41 Ph4nt0m5",650],
      ["R00t C0ntr0llers",650],["Ctrl + Alt + Defeat",550],["Obsidian",550],["Terminal Titans",550],["Believe Yourself",550],
      ["chris_e1b7d0",500],["CODETITANS",500],["0xPhantom",450],["B!n@ry_Expl0iT",450],["Avyukt Security",450],
      ["EncodeX",450],["Techbudy",450],["Team Daemon",450],["Mr.Robot",450],["gryffindor",450],
      ["Trial N Error",450],["No Direction",450],["WhiteWolfs",450],["Noob_Baddies",450],["Zyrostan",400],
      ["Haxharmoney",400],["Dholakpur warriors",250],["Order_Of_Phoniex",250],["convoycode",250],["Lag Gye Guru",250],
      ["BitFlux",250],["Team IIITP",250],["EvilCorp",250],["atk",250],["SkyRough",250],
      ["Triple A Batteries",250],["nexus",250],["KSPNode",250],["Root_Force",250],["BIT PIRATES",250],
      ["TEAMPONDASIGNALSS",250],["Unit IL-LOG-ICAL",250],["Chakravyuh7",250],["Team Phantoms",250],["DeadPhoenix11",200],
      ["team_7even",200],["Cicada-vicd",200],["Cyber Rangers",200],["Null_Vortex",50],["Firewall Phantoms",50],
      ["Funky pandas",50],["Hexcoders",50],["Cyber Wellfire",50],["ByteForge",50],["Team targeted",50],
      ["CyberUNIT",50]
    ],
    prizes: [
      { place: "1st", cash: "₹1,10,000", worth: "₹6,00,000+",
        perks: ["ASCP, ACP, CASA", "The XSSRat 900 Bundle", "PWNDORA licence", "Black Perl academic access", "BCAD exam and training voucher", ".xyz domain", "zSecurity coupons", "C3SA", "Beeceptor Team plan", "Altered Security CRTP", "Stellar Data Recovery", "HackerDNA Pro", "Goodies"] },
      { place: "2nd", cash: "₹60,000", worth: "₹4,00,000+",
        perks: ["ASCP, ACP, CASA", "The XSSRat 900 Bundle", "PWNDORA licence", "Black Perl academic access", "BCAD exam and training voucher", ".xyz domain", "C3SA", "zSecurity coupons", "Stellar Data Recovery", "Beeceptor Team plan", "HackerDNA Pro", "Goodies"] },
      { place: "3rd", cash: "₹30,000", worth: "₹3,55,000+",
        perks: ["ASCP, ACP, CASA", "C3SA", "The XSSRat 903 & 907 Bundle", "PWNDORA licence", "Black Perl academic access", "BCAD exam and training voucher", ".xyz domain", "zSecurity coupons", "Stellar Data Recovery", "Beeceptor Team plan", "HackerDNA Pro", "Goodies"] }
    ],
    prizesRest: [
      { place: "4th to 10th", perks: ["ACP, CASA, APU", "The XSSRat 020 Bundle", "C3SA", ".xyz domain", "Beeceptor Team plan", "HackerDNA Pro", "Goodies"] },
      { place: "Every participant", perks: ["Beeceptor Team plan", "The XSSRat 020 Bundle", "50% off INE 1-year Premium", "50% off CWL CRTA"] }
    ],
    sponsors: [
      { tier: "Platinum", list: [["Forensic CyberTech Pvt. Ltd.", "https://forensiccybertech.com/"], ["Soft Computing Research Society", "https://scrs.in/"]] },
      { tier: "Diamond", list: [["Cyphy Tech Security Pvt. Ltd.", "https://cyphyts.in/"], ["BlackPerl", "https://blackperldfir.com/"]] },
      { tier: "Gold", list: [["eSec Forte Technologies Pvt. Ltd.", "https://www.esecforte.com/"]] },
      { tier: "API partner", list: [["Beeceptor", "https://beeceptor.com"]] },
      { tier: "Platform partner", list: [["CTF7", "https://ctf7.com/"]] },
      { tier: "In-kind partners", list: [["APIsec University", "https://www.apisecuniversity.com/"], ["Stellar Data Recovery", "https://www.stellarinfo.com/"], ["INE", "https://ine.com/"], ["Altered Security", "https://www.alteredsecurity.com/"], ["zSecurity", "https://zsecurity.org/"], ["CyberWarFare Labs", "https://cyberwarfare.live/"], ["The XSS Rat", "http://thexssrat.com/"], ["HackerDNA", "https://hackerdna.com/"], [".xyz", "https://nic.xyz/"]] }
    ]
  },

  /* ---------- Crew ---------- */
  faculty: [
    { name: "Dr. J. M. Vyas", role: "Chief Patron", line: "Hon'ble Vice Chancellor, NFSU" },
    { name: "Prof. (Dr.) Naveen Chaudhary", role: "Patron", line: "Director, NFSU Goa Campus" },
    { name: "Dr. Lokesh Chouhan", role: "Convener", line: "Dean Academics, NFSU Goa Campus" },
    { name: "Mr. Sunder Lal Sharma", role: "", line: "Deputy Registrar, NFSU Goa Campus" },
    { name: "Dr. Panem Charanarur", role: "Faculty Coordinator", line: "Associate Dean (I/C), NFSU Goa Campus" },
    { name: "Mr. Harsh Panchal", role: "Faculty Coordinator", line: "Lecturer, NFSU Goa Campus" }
  ],
  core: [
    { name: "Chandrashekhar Donagaon", role: "Core crew", line: "M.Sc. Cybersecurity, 2024–2026" },
    { name: "Ravindra Parihar", role: "Core crew", line: "M.Sc. Cybersecurity, 2024–2026" },
    { name: "Yuvraj Singh Deora", role: "Core crew", line: "M.Sc. Cybersecurity, 2024–2026" },
    { name: "Haardik Bhagtani", role: "Core crew", line: "M.Sc. Cybersecurity, 2024–2026" }
  ],
  /* TODO: replace each placeholder with { name, role, line, linkedin } */
  newCrew: Array.from({ length: 8 }, () => ({ name: "", role: "Organising crew", line: "" }))
};

/* ---------- Captain Kaal & the rival pirates (dialogue for the living world) ---------- */
window.KC.totalFlags = 8; // hidden .flag-egg buttons: 5 on index, 2 on logbook, 1 on crew
window.KC.captain = {
  greet: ["Ahoy. Captain Kaal of the Kaalnaav. Welcome to the Kaalchakra sea.", "You found the ship. Good. Now find the flags."],
  archive: ["The Hall of Legends. Mind the candle, these logbooks are older than my boots.", "Every crew from 2026 is written in here. Even the ones who sank."],
  crewIntro: ["My crew. Faculty up top, the core four below, and fresh hands joining for 2.0.", "Let me introduce the people who keep this ship afloat."],
  introduce: "This is {name}. {role}.",
  idle: [
    "Eight hidden flags on this site. I count them every night.",
    "A crew is one to three pirates. Choose wisely.",
    "Flag format: Kaal{...}. Write it on your hand.",
    "Qualifier is online. Only the finals need a ship to Goa.",
    "root@void went from fourth to first last season. The sea respects nerve.",
    "Wind's changing. Feels like a CTF coming."
  ],
  spotSails: ["Black sails on the horizon. Of course.", "Raiders. And they've brought fog with them."],
  chased: ["Not now, gentlemen, I'm working!", "Time for a strategic retreat!"],
  escaped: ["Hide-and-seek champion of the Arabian Sea.", "They'll be searching that horizon for a week."],
  refuse: ["Flags? Never heard of them.", "The flags belong to whoever solves the challenges. Not you."],
  escape: ["And this is where I leave!", "Smoke, mirrors and excellent footwork."],
  flagStolen: ["Oi! That flag is for the players!", "Put that back, you bilge rat!"],
  guardFlag: ["Just airing out a flag. Nobody touch it."],
  flagBack: ["Flag recovered. Back where it belongs.", "Nobody steals a flag on my watch. You have to solve for it."],
  deflect: ["Ha! Missed.", "Nice try. Next time aim at the ship."],
  dodge: ["Bomb!", "That's not how you capture a flag!"],
  darkSea: ["Something just entered the sea...", "Lanterns up. Stay close."],
  calmAgain: ["...and it's gone. Back to the CTF.", "Calm waters again. For now."],
  boarding: ["They're coming alongside! Ready the deck!", "Grappling hooks! All hands!"],
  fightWin: ["Back to the deep with you.", "That's how we handle a DoS on this deck.", "Rate-limited. Permanently."],
  treasureStart: ["Hold on. I smell gold.", "Something's buried here..."],
  treasureFound: ["Treasure! Ten doubloons for your pocket.", "Look at that shine!"],
  poke: ["Ahoy! Need something?", "Registration alerts are on Discord, matey.", "Careful, I'm armed. Mostly with puns.", "Got a flag for me?", "I'm on duty. Captain duty."],
  annoyed: ["Alright, ALRIGHT. I'm awake.", "Poke me again and you're swabbing the deck.", "That's quite enough poking for one voyage."],
  fastScroll: ["Whoa! Easy on the wheel, sailor!", "Steady! You'll capsize the whole page!"],
  cta: ["That one. Get the registration alerts.", "Right there, sailor. Sign the articles when they open."],
  discord: ["That's where the crew gathers. Join us.", "Discord. All the announcements land there first."],
  faqNear: ["Questions? Open one and I'll answer it.", "Ask away. I know everything. Mostly."],
  flag: "Flag {n} of {t}! Sharp eyes, sailor.",
  allFlags: "All 8 flags! Your secret: Kaal{y0u_turn3d_th3_wh33l}. Show it off on our Discord."
};
window.KC.pirates = {
  taunt: ["Your flags or your hat, Captain!", "Nice ship. Ours now.", "Hand over the flags!"],
  demand: ["Give us the flags!", "The flags, Kaal. Now."],
  confused: ["Where'd he go?!", "Blasted smoke!"],
  retreat: ["Retreat! RETREAT!", "This isn't over, Kaal!", "I'll be back with more pirates!"],
  chase: ["After him!", "He's got the flags!"],
  gunner: ["Hold still, Captain!", "One shot. That's all I need."],
  bomb: ["Catch!", "Special delivery!"],
  bombLaugh: ["Ha! Missed you on purpose.", "Heh heh heh."],
  raid: ["Ooh, a shiny flag...", "Nobody's watching this one."],
  board: ["Boarding party!", "Here we come!"]
};

/* ---------- optional real assets (leave empty to use the built-in procedural ones) ---------- */
window.KC.audio = {
  volume: 0.22,          // master volume when the visitor turns sound on (it starts off)
  files: {}              // e.g. { clash: "assets/audio/clash.mp3", cannon: "assets/audio/cannon.mp3", treasure: "assets/audio/treasure.mp3" }
};
