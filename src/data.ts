// Replace these values with the business's own details before going live.
export const business = {
  name: "3T Station",
  whatsapp: "", // International digits only, e.g. 60123456789. No '+' or spaces.
  email: "",
  address: "",
  logo: "", // Add your logo to public/images and enter /images/your-logo.svg here.
};

export type Game = { name: string; slug: string; image: string; category: string; region: string };
const assets = "https://ext.same-assets.com/3977561172/";
export const games: Game[] = [
  { name: "Mobile Legends", slug: "mobile-legends-my", image: "1054403436.bin", category: "UID Games", region: "Malaysia" },
  { name: "PUBG Mobile", slug: "pubg-mobile", image: "3779810430.bin", category: "UID Games", region: "Global" },
  { name: "Free Fire", slug: "free-fire-malaysia", image: "563985834.bin", category: "UID Games", region: "Malaysia / Singapore" },
  { name: "Honor of Kings", slug: "honor-of-kings", image: "2376758521.bin", category: "UID Games", region: "Global" },
  { name: "Magic Chess: Go Go", slug: "magic-chess-go-go-malaysia", image: "1438158839.bin", category: "UID Games", region: "Malaysia" },
  { name: "Arena Breakout", slug: "arena-breakout", image: "257777593.bin", category: "UID Games", region: "Global" },
  { name: "Mobile Legends Global", slug: "mobile-legends-global", image: "1084134549.bin", category: "Other Region", region: "Global" },
  { name: "Gangstar Mirage: City", slug: "gangstar-mirage-city", image: "1917551875.bin", category: "UID Games", region: "Global" },
  { name: "Mobile Legends Indonesia", slug: "mobile-legends-id", image: "929177246.bin", category: "Other Region", region: "Indonesia" },
  { name: "Free Fire Indonesia", slug: "free-fire-indonesia", image: "3886489919.bin", category: "Other Region", region: "Indonesia" },
  { name: "Racing Master", slug: "racing-master", image: "4089608135.bin", category: "UID Games", region: "Global" },
  { name: "BLEACH Soul Resonance", slug: "bleach-soul-resonance", image: "1099495544.bin", category: "UID Games", region: "Global" },
  { name: "Arena of Valor", slug: "arena-of-valor", image: "2539285013.bin", category: "UID Games", region: "Global" },
  { name: "AFK Journey", slug: "afk-journey", image: "1442224154.bin", category: "UID Games", region: "Global" },
  { name: "Age of Empires Mobile", slug: "age-of-empires-mobile", image: "332102200.bin", category: "UID Games", region: "Global" },
  { name: "Free Fire Global", slug: "free-fire-global", image: "2607749342.bin", category: "Other Region", region: "Global" },
  { name: "Mobile Legends Brazil", slug: "mobile-legends-brazil", image: "352569080.bin", category: "Other Region", region: "Brazil" },
  { name: "PUBG: NEW STATE", slug: "pubg-new-state", image: "2230248108.bin", category: "UID Games", region: "Global" },
  { name: "Arena Breakout: Infinite", slug: "arena-breakout-infinite", image: "2861325836.bin", category: "UID Games", region: "Global" },
  { name: "Asphalt 9: Legends", slug: "asphalt-9-legends", image: "4240306314.bin", category: "UID Games", region: "Global" },
  { name: "Mobile Legends Singapore", slug: "mobile-legends-my-sg", image: "1122982667.bin", category: "Other Region", region: "Singapore" },
  { name: "ASTRA: Knights of Veda", slug: "astra-knights-of-veda", image: "2416979187.bin", category: "UID Games", region: "Global" },
  { name: "Mobile Legends Philippines", slug: "mobile-legends-ph", image: "840868000.bin", category: "Other Region", region: "Philippines" },
  { name: "AU2 Mobile", slug: "au2-mobile", image: "1277204792.bin", category: "UID Games", region: "Global" },
  { name: "Mobile Legends Russia", slug: "mobile-legends-russia", image: "77904436.bin", category: "Other Region", region: "Russia" },
  { name: "Be The King: Judge Destiny", slug: "be-the-king-judge-destiny", image: "2525480171.bin", category: "UID Games", region: "Global" },
  { name: "Mobile Legends (Via Login)", slug: "mobile-legends-top-up-via-login", image: "906588491.bin", category: "Via Login", region: "Ask about availability" },
  { name: "Mobile Legends Turkey", slug: "mobile-legends-turkey", image: "2172976108.bin", category: "Other Region", region: "Turkey" },
].map(game => ({ ...game, image: assets + game.image }));

// Shared across every game, matching the supplied top-up website example.
export const topupPackages = [
  ["14 (13+1) Diamonds", "1.13"],
  ["42 (38+4) Diamonds", "3.32"],
  ["70 (64+6) Diamonds", "5.39"],
  ["112 Diamond (102+10 Bonus)", "8.27"],
  ["140 (127+13) Diamonds", "10.78"],
  ["278 (253+25) Diamonds", "20.33"],
  ["284 (254+30) Diamonds", "21.60"],
  ["355 (317+38) Diamonds", "27.01"],
  ["429 (383+46) Diamonds", "32.40"],
  ["571 (505+66) Diamonds", "40.63"],
  ["716 (633+83) Diamonds", "53.99"],
  ["1192 (1010+182) Diamonds", "81.30"],
];

export const flavors = [
  { name: "Mango", slug: "mango", tagline: "A little tropical escape.", description: "Sunshine on a stick. Sweet mango meets smooth, tangy yogurt for your feel-good pick-me-up.", note: "TROPICAL & SUNNY", image: "/images/yogurt-mango.jpg" },
  { name: "Blueberry", slug: "blueberry", tagline: "Berry good. Every bite.", description: "A mellow, berry-filled moment. Blueberry and creamy yogurt make a beautifully balanced pair.", note: "BOLD & BERRY-LICIOUS", image: "/images/yogurt-blueberry.jpg" },
  { name: "Strawberry", slug: "strawberry", tagline: "The sweetest kind of classic.", description: "Your forever favourite. Bright strawberry swirled with creamy yogurt for a little everyday joy.", note: "SWEET & FEEL-GOOD", image: "/images/yogurt-strawberry.jpg" },
];

export const repairs = [
  { name: "Screen repair", icon: "screen", description: "Cracks, flickering, or a screen that won't respond? Tell us your phone model and we'll help you find the right screen replacement." },
  { name: "Battery replacement", icon: "battery", description: "Always looking for a charger? Let's check your battery and discuss a replacement that gets you through more of your day." },
  { name: "Charging issues", icon: "bolt", description: "A loose connection or a phone that won't charge? We'll help identify whether the cable, port, or another component needs attention." },
  { name: "Something else", icon: "tool", description: "Camera trouble, sound issues, or something you can't quite explain? Share what happened and we'll discuss the next step." },
];
