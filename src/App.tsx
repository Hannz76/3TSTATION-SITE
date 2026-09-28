import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { business, flavors, games, topupPackages, repairs, type Game } from "./data";

function Icon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const paths: Record<string, ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    diagonal: <path d="M6 18 18 6M6 6h12v12" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    down: <path d="m6 9 6 6 6-6" />,
    game: <><path d="M7 7h10c3 0 4 4 5 10 .5 3-2 4-4 2l-3-3H9l-3 3c-2 2-4.5 1-4-2C3 11 4 7 7 7Z" /><path d="M6 10v5m-2.5-2.5h5M15 11h.01M18 14h.01M9 7l1-3h4" /></>,
    screen: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4m-3 14h2" /></>,
    stick: <><rect x="7" y="3" width="10" height="16" rx="3" /><path d="M10 19v3m4-3v3M7 9h10" /></>,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" />,
    shield: <><path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    heart: <path d="M20.5 4.7a5.5 5.5 0 0 0-7.8 0L12 5.5l-.7-.8a5.5 5.5 0 0 0-7.8 7.8L12 21l8.5-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    chat: <><path d="M21 11.5a9 9 0 0 1-13.3 8L3 21l1.5-4.7A9 9 0 1 1 21 11.5Z" /><path d="M8 9h8m-8 4h5" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    sparkle: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>,
    battery: <><rect x="2" y="6" width="18" height="12" rx="2" /><path d="M23 10v4M6 10v4m4-4v4m4-4v4" /></>,
    tool: <path d="m14 7 3 3 4-4a7 7 0 0 1-9 9l-6 6-3-3 6-6a7 7 0 0 1 9-9l-4 4Z" />,
    leaf: <><path d="M20 3C9 2 2 7 5 16c9 4 15-2 15-13Z" /><path d="M3 21 15 9" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6m-6 4h6" /></>,
    calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8m-8 5h2m4 0h2m-8 4h2m4 0h2" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z" />,
  };
  return <svg className={className} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.sparkle}</svg>;
}

type ModalState = { type: "repair"; issue: string } | { type: "yogurt"; flavor: number } | { type: "contact" } | null;
type OpenModal = (modal: ModalState) => void;

function Brand({ footer = false }: { footer?: boolean }) {
  return <a className={`brand ${footer ? "brand-footer" : ""}`} href="/#home" aria-label="3T Station home">
    {business.logo ? <img className="brand-logo" src={business.logo} alt="3T Station logo" /> : <span className="brand-mark" title="Your logo goes here">3T<span>✳</span></span>}
    <span className="brand-name">3T STATION<span>YOUR EVERYDAY PIT STOP.</span></span>
  </a>;
}

function Header({ openModal }: { openModal: OpenModal }) {
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === "dark");
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("3t-theme", next ? "dark" : "light"); } catch { /* Browsers with blocked storage still get the theme for this page. */ }
  };
  return <>
    <div className="announcement"><span>Three good things. One happy place.</span><span className="announcement-right">Made for your everyday <Icon name="sparkle" size={13} /></span></div>
    <header className="header"><div className="container header-inner"><Brand />
      <nav className={mobile ? "navigation navigation-open" : "navigation"} id="main-navigation" aria-label="Main navigation">
        {[ ["Game top-up", "/#games"], ["Phone repair", "/repair"], ["Fresh yogurt", "/#yogurt"], ["Our story", "/#about"] ].map(([label, href]) => <a key={href} href={href} onClick={() => setMobile(false)}>{label}</a>)}
        <button className="mobile-contact" onClick={() => { setMobile(false); openModal({ type: "contact" }); }}>Let's talk <Icon name="chat" size={16} /></button>
      </nav>
      <button className="theme-toggle icon-button" type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}><Icon name={dark ? "sun" : "moon"} size={19} /></button>
      <button className="button button-small header-contact" onClick={() => openModal({ type: "contact" })}>Let's talk <Icon name="chat" size={17} /></button>
      <button className="menu-toggle icon-button" aria-label={mobile ? "Close navigation" : "Open navigation"} aria-expanded={mobile} aria-controls="main-navigation" onClick={() => setMobile(!mobile)}><Icon name={mobile ? "close" : "menu"} /></button>
    </div></header>
  </>;
}

function PhoneArt({ small = false }: { small?: boolean }) {
  return <div className={`phone-art ${small ? "phone-art-small" : ""}`} aria-hidden="true">
    <div className="phone phone-back"><div className="camera-island"><i /><i /><i /><b /></div><span className="phone-back-mark">3T</span></div>
    <div className="phone phone-front"><div className="phone-island" /><span className="phone-time">09:41</span><div className="phone-screen-art"><span className="phone-check"><Icon name="check" size={small ? 26 : 36} /></span><strong>Good as new.</strong><span>Back to your everyday.</span></div><div className="phone-home" /></div>
    {!small && <><span className="repair-float"><Icon name="tool" size={17} /> A fresh start.</span><span className="phone-sparkle"><Icon name="sparkle" size={40} /></span></>}
  </div>;
}

function Hero() {
  return <section className="hero container" id="home">
    <div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> WELCOME TO YOUR NEW FAVOURITE STATION</div>
      <h1>Level up.<br />Fix up.<br /><span>Freshen up.</span><span className="heading-sparkle">✳</span></h1>
      <p>More play. Less worry. A little sweetness.<br />Game top-ups, phone repairs, and delicious yogurt.<br className="desktop-break" /> All the good stuff, right here at 3T Station.</p>
      <div className="hero-actions"><a className="button" href="#services">Find your thing <Icon name="arrow" size={19} /></a><a className="text-link" href="#about">Meet 3T Station <Icon name="diagonal" size={16} /></a></div>
      <div className="hero-footnote"><span className="mini-service-icons"><Icon name="game" size={14} /><Icon name="screen" size={14} /><Icon name="stick" size={14} /></span><span>3 little ways to make your day better.</span></div>
    </div>
    <div className="hero-bento">
      <a className="bento-game" href="/topup"><div className="bento-label"><span><Icon name="game" size={16} /> PLAY WITHOUT LIMITS</span><span className="round-arrow"><Icon name="diagonal" size={18} /></span></div><div className="bento-game-title">Your next level<br />starts here.</div><span className="bento-game-outline">PLAY</span><img className="controller-image" src="/images/game-controller.svg" alt="White gaming controller with lime-green details" /><span className="bento-sticker"><Icon name="bolt" size={13} /> GAME ON.</span><span className="bento-caption">Game top-ups, made simple.</span></a>
      <a className="bento-repair" href="#repair"><div className="bento-label"><span>FIX IT. LOVE IT AGAIN.</span><Icon name="diagonal" size={18} /></div><h2>Back in<br />your hands.</h2><PhoneArt small /><span className="small-bento-caption">Phone repair <Icon name="arrow" size={14} /></span></a>
      <a className="bento-yogurt" href="#yogurt"><div className="bento-label"><span>HAPPINESS, ON A STICK.</span><Icon name="diagonal" size={18} /></div><h2>Take a<br /><em>sweet</em> break.</h2><span className="bento-yogurt-photos">{flavors.map(flavor => <img key={flavor.slug} src={flavor.image} alt={`${flavor.name} yogurt stick`} />)}</span><span className="small-bento-caption">Fresh yogurt <Icon name="arrow" size={14} /></span></a>
      <span className="bento-orbit" aria-hidden="true">✳</span>
    </div>
  </section>;
}

function Services() {
  const services = [
    { number: "01", icon: "game", title: "Fuel your game", copy: "Your favourite games. Your next big win.", href: "games", color: "green" },
    { number: "02", icon: "screen", title: "Revive your phone", copy: "A little care. A lot more life.", href: "repair", color: "blue" },
    { number: "03", icon: "stick", title: "Find your flavour", copy: "Three fruity reasons to smile.", href: "yogurt", color: "pink" },
  ];
  return <div className="service-strip container" id="services">{services.map(service => <a href={`#${service.href}`} className="service-item" key={service.number}><span className={`service-icon ${service.color}`}><Icon name={service.icon} size={24} /></span><div><h3>{service.title}</h3><p>{service.copy}</p></div><span className="service-number">{service.number}</span></a>)}</div>;
}

function GameImage({ game }: { game: Game }) {
  const [failed, setFailed] = useState(false);
  return <span className={`game-image ${failed ? "image-fallback" : ""}`}>{failed ? <><Icon name="game" size={42} /><strong>{game.name}</strong></> : <img src={game.image} alt={game.name} loading="lazy" onError={() => setFailed(true)} />}</span>;
}

function GameCard({ game, index }: { game: Game; index: number }) {
  return <a className="game-card" href={`/topup/order/${game.slug}`}><span className="game-cover"><GameImage game={game} />{index === 0 && <span className="game-badge"><Icon name="bolt" size={11} /> FAN FAVOURITE</span>}<span className="game-hover">Let's play <Icon name="arrow" size={18} /></span></span><span className="game-card-bottom"><span><strong>{game.name}</strong><small>{game.region}</small></span><span className="game-card-arrow"><Icon name="diagonal" size={16} /></span></span></a>;
}

function GameSection() {
  return <section className="section container game-section" id="games"><div className="section-heading"><div><div className="eyebrow"><span className="section-index">01 /</span> THE PLAY STATION</div><h2>Big plays start with<br className="mobile-break" /> a little top-up<span className="green-text">.</span></h2><p>Pick your game. Power up your account. Get back to what you love.</p></div><a className="text-link" href="/topup">Explore all games <span className="count-badge">{games.length}</span><Icon name="arrow" size={18} /></a></div><div className="game-grid">{games.slice(0, 6).map((game, index) => <GameCard game={game} key={game.slug} index={index} />)}</div><div className="game-benefits"><span><Icon name="shield" size={16} /> No password needed for UID top-ups</span><span><Icon name="globe" size={16} /> Local & global favourites</span><span><Icon name="chat" size={16} /> A real person to help</span></div></section>;
}

const topupLinks = [
  { title: "All games", path: "/topup", icon: "game" },
  { title: "Track order", path: "/topup/track-order", icon: "receipt" },
  { title: "Calculator", path: "/topup/calculator", icon: "calculator" },
  { title: "Check region", path: "/topup/check-region", icon: "pin" },
];

function TopupNavigation({ path }: { path: string }) {
  return <nav className="topup-nav" aria-label="Game top-up navigation"><div className="container topup-nav-inner"><span className="topup-nav-label"><Icon name="bolt" size={16} /> PLAY STATION</span><div className="topup-nav-links">{topupLinks.map(link => <a key={link.path} href={link.path} aria-current={path === link.path ? "page" : undefined} className={path === link.path ? "active" : ""}><Icon name={link.icon} size={16} />{link.title}</a>)}</div><a className="topup-nav-home" href="/"><Icon name="home" size={16} /> Main site</a></div></nav>;
}

function TopupTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <div className="topup-title"><div className="eyebrow"><span className="section-index">3T /</span> {eyebrow}</div><h1>{title}<span className="green-text">.</span></h1><p>{copy}</p></div>;
}

function TopupCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All games");
  const filtered = games.filter(game => `${game.name} ${game.region} ${game.category}`.toLowerCase().includes(query.toLowerCase()) && (category === "All games" || game.category === category));
  return <>
    <div className="topup-hero"><div className="topup-hero-primary"><span className="eyebrow"><Icon name="bolt" size={16} /> THE PLAY STATION</span><h1>Pick a game.<br /><span>Power up.</span></h1><p>Find your favourite and get your next adventure started. Good games deserve good energy.</p><a href="#browse-games" className="button button-dark">Browse all games <Icon name="arrow" size={18} /></a><span className="topup-hero-outline" aria-hidden="true">PLAY</span><img src="/images/game-controller.svg" alt="White game controller with lime details" /></div><div className="topup-hero-side"><div className="topup-side-upper"><span className="eyebrow">YOUR FAVOURITES, RIGHT HERE</span><h2>Every game<br />has a next level.</h2><Icon name="game" size={64} /></div><div className="topup-side-lower"><Icon name="shield" size={26} /><div><strong>Top up with peace of mind.</strong><p>Check your player ID carefully. We'll confirm price and availability before any payment.</p></div></div></div></div>
    {!query && category === "All games" && <section className="topup-popular" aria-labelledby="popular-title"><div className="topup-section-heading"><div><div className="eyebrow"><Icon name="sparkle" size={16} /> POPULAR PICKS</div><h2 id="popular-title">In the spotlight<span className="green-text">.</span></h2></div><a href="#browse-games" className="text-link">See all games <Icon name="arrow" size={17} /></a></div><div className="game-grid">{games.slice(0, 6).map((game, index) => <GameCard key={game.slug} game={game} index={index} />)}</div></section>}
    <section className="topup-browse" id="browse-games" aria-labelledby="browse-title"><div className="topup-section-heading"><div><div className="eyebrow"><Icon name="game" size={16} /> THE FULL LINEUP</div><h2 id="browse-title">All games<span className="green-text">.</span></h2></div><span className="topup-game-count">{games.length} titles to explore</span></div><label className="search-field topup-search"><Icon name="search" size={19} /><input type="search" aria-label="Search games" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search games or regions..." /></label><div className="catalog-tabs" role="group" aria-label="Game categories">{["All games", "UID Games", "Other Region", "Via Login"].map(tab => <button type="button" aria-pressed={category === tab} className={category === tab ? "selected" : ""} key={tab} onClick={() => setCategory(tab)}>{tab}</button>)}</div><p className="result-count" role="status">Showing {filtered.length} game{filtered.length === 1 ? "" : "s"}</p>{filtered.length ? <div className="topup-game-grid">{filtered.map((game, index) => <GameCard game={game} key={game.slug} index={index + 1} />)}</div> : <div className="empty-state"><Icon name="search" size={36} /><h3>No games found just yet.</h3><p>Try another title or choose a different category.</p><button className="text-link" onClick={() => { setQuery(""); setCategory("All games"); }}>Show all games <Icon name="arrow" size={16} /></button></div>}</section>
    <div className="topup-bottom-note"><Icon name="chat" size={22} /><p>Can't find what you're looking for? Reach out and we'll let you know what's available.</p><a href="/#games" className="text-link">Back to the main site <Icon name="diagonal" size={16} /></a></div>
  </>;
}

function TopupTracking() {
  return <div className="topup-tool-page"><TopupTitle eyebrow="TRACK ORDER" title="Where's my top-up?" copy="An order tracker needs a live order system. For now, contact our team with your order reference if you have one." /><div className="topup-tool-panel topup-unavailable"><span className="topup-tool-icon"><Icon name="receipt" size={28} /></span><h2>Tracking isn't live yet.</h2><p>Enquiries created on this site are drafts, not placed orders. Once the ordering system is connected, you'll be able to look up your status right here.</p>{business.whatsapp ? <a className="button" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hi 3T Station! I'd like to ask about my game top-up order.")}`} target="_blank" rel="noreferrer">Ask about an order <Icon name="chat" size={17} /></a> : <a className="button" href="/topup">Explore games <Icon name="arrow" size={18} /></a>}</div></div>;
}

function TopupCalculator() {
  const [matches, setMatches] = useState("");
  const [rate, setRate] = useState("");
  const [target, setTarget] = useState("");
  const [answer, setAnswer] = useState("");
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const m = Number(matches), current = Number(rate), desired = Number(target);
    if (!Number.isSafeInteger(m) || m < 1 || current < 0 || current > 100 || desired <= current || desired >= 100) {
      setAnswer("Enter at least one match and a target higher than your current rate but below 100%.");
      return;
    }
    const wins = Math.ceil((m * (desired - current)) / (100 - desired));
    setAnswer(`You'll need about ${wins} consecutive win${wins === 1 ? "" : "s"} to reach ${desired}%. Your current win rate may be rounded in-game, so this is an estimate.`);
  }
  return <div className="topup-tool-page"><TopupTitle eyebrow="GAME TOOLS" title="Do the math. Make the play." copy="Wondering how many wins it takes to hit your goal? Let's work it out." /><form className="topup-tool-panel topup-calc-form" onSubmit={calculate}><span className="topup-tool-icon"><Icon name="calculator" size={27} /></span><h2>Win rate calculator</h2><p>A quick estimate based on your current match count and displayed win rate.</p><label>Total matches played<input type="number" required min="1" max="100000000" step="1" value={matches} onChange={event => setMatches(event.target.value)} placeholder="e.g. 200" /></label><div className="topup-tool-fields"><label>Current win rate (%)<input type="number" required min="0" max="100" step="any" value={rate} onChange={event => setRate(event.target.value)} placeholder="e.g. 54" /></label><label>Target win rate (%)<input type="number" required min="0" max="99.99" step="any" value={target} onChange={event => setTarget(event.target.value)} placeholder="e.g. 60" /></label></div><button className="button full-width" type="submit">Calculate wins <Icon name="arrow" size={17} /></button>{answer && <div className="topup-tool-result" role="status">{answer}</div>}</form></div>;
}

function TopupRegion() {
  const [uid, setUid] = useState("");
  const [zone, setZone] = useState("");
  const [checked, setChecked] = useState(false);
  return <div className="topup-tool-page"><TopupTitle eyebrow="MOBILE LEGENDS" title="Check your ID format." copy="A quick format check before you request an MLBB top-up. This doesn't connect to the game or identify your region." /><form className="topup-tool-panel topup-calc-form" onSubmit={event => { event.preventDefault(); setChecked(true); }}><span className="topup-tool-icon"><Icon name="pin" size={28} /></span><h2>Player &amp; zone ID</h2><p>Find both numbers in your in-game profile and double-check them before sharing.</p><div className="topup-tool-fields"><label>User ID<input required inputMode="numeric" pattern="[0-9]{4,20}" title="Enter a user ID with 4–20 digits." value={uid} onChange={event => { setUid(event.target.value.replace(/\D/g, "")); setChecked(false); }} placeholder="Your user ID" /></label><label>Zone ID<input required inputMode="numeric" pattern="[0-9]{3,10}" title="Enter a zone ID with 3–10 digits." value={zone} onChange={event => { setZone(event.target.value.replace(/\D/g, "")); setChecked(false); }} placeholder="Your zone ID" /></label></div><button className="button full-width" type="submit">Check ID format <Icon name="arrow" size={17} /></button>{checked && <div className="topup-tool-result" role="status"><Icon name="check" size={17} /> The format looks right. Only the game's servers can verify your account or region.</div>}</form></div>;
}

function TopupPage({ path }: { path: string }) {
  const game = path.startsWith("/topup/order/") ? games.find(item => item.slug === path.slice("/topup/order/".length)) : undefined;
  return <><TopupNavigation path={game ? "/topup" : path} /><main id="main-content" className="topup-main container">{path === "/topup" ? <TopupCatalog /> : game ? <><a className="topup-back" href="/topup"><Icon name="chevron" size={16} /> All games</a><div className="topup-product-banner"><span className="eyebrow"><Icon name="bolt" size={16} /> THE PLAY STATION</span><h1>Ready for your next level?</h1><img src="/images/game-controller.svg" alt="" /></div><div className="topup-product-head"><GameImage game={game} /><div><span className="eyebrow">{game.category} · {game.region}</span><h1>{game.name}</h1><p>Choose a package, check your details, and prepare your enquiry.</p></div></div><div className="topup-order-layout"><div className="topup-order-card"><TopupForm key={game.slug} game={game} /></div><aside className="topup-order-aside"><Icon name="shield" size={28} /><h2>A little peace of mind.</h2><p>This is an enquiry, not a payment page. We'll confirm availability, price, and how to proceed before an order is placed.</p><div><Icon name="check" size={17} /> Double-check your player ID.</div><div><Icon name="check" size={17} /> No password for UID top-ups.</div><div><Icon name="check" size={17} /> Confirm pricing before paying.</div></aside></div></> : path === "/topup/track-order" ? <TopupTracking /> : path === "/topup/calculator" ? <TopupCalculator /> : path === "/topup/check-region" ? <TopupRegion /> : <div className="topup-tool-page"><TopupTitle eyebrow="PAGE NOT FOUND" title="Wrong turn?" copy="Let's get you back to the games." /><a className="button" href="/topup">Explore all games <Icon name="arrow" size={18} /></a></div>}</main></>;
}

function RepairSection() {
  const [selected, setSelected] = useState(0);
  return <section className="repair-section" id="repair"><div className="container repair-layout"><div className="repair-visual"><div className="repair-visual-top"><span className="eyebrow"><span className="live-dot" /> MORE LIFE. LESS E-WASTE.</span><Icon name="sparkle" size={24} /></div><span className="repair-background-word" aria-hidden="true">RE:NEW</span><PhoneArt /><div className="repair-visual-bottom"><span>Keep the phone.<br /><strong>Lose the problem.</strong></span><span className="circular-note">REPAIR<br /><Icon name="heart" size={18} /><br />NOT REPLACE</span></div></div><div className="repair-copy"><div className="eyebrow"><span className="section-index">02 /</span> THE FIX STATION</div><h2>Oops happens.<br /><span>We can help.</span></h2><p>Cracked screen? Battery on its last breath?<br />Your phone's story doesn't have to end here.</p><div className="repair-options" role="group" aria-label="Choose a repair service">{repairs.map((repair, index) => <button className={selected === index ? "selected" : ""} aria-pressed={selected === index} key={repair.name} onClick={() => setSelected(index)}><Icon name={repair.icon} size={18} />{repair.name}<Icon name="chevron" size={15} /></button>)}</div><p className="repair-description" aria-live="polite">{repairs[selected].description}</p><a className="button" href="/repair">Explore repair services <Icon name="arrow" size={18} /></a><div className="repair-note"><Icon name="check" size={15} /> See service options, estimated prices, and next steps.</div></div></div></section>;
}

function YogurtSection({ openModal }: { openModal: OpenModal }) {
  return <section className="section container yogurt-section" id="yogurt"><div className="section-heading"><div><div className="eyebrow"><span className="section-index">03 /</span> THE HAPPY STATION</div><h2>A little stick. A lot of happy<span className="green-text">.</span></h2><p>Your everyday deserves a sweet little pause. Make it a yogurt moment.</p></div><span className="yogurt-handwritten">Unwrap. Smile. Repeat. <span>↴</span></span></div><div className="flavor-grid">{flavors.map((flavor, index) => <article className={`flavor-card ${flavor.slug}`} key={flavor.slug}><div className="flavor-art"><span className="flavor-note">{flavor.note}</span><span className="flavor-background-text" aria-hidden="true">{flavor.name}</span><img src={flavor.image} alt={`${flavor.name} yogurt stick`} loading="lazy" /><span className="flavor-art-sparkle" aria-hidden="true">✧</span></div><div className="flavor-copy"><div><h3>{flavor.name}</h3><p>{flavor.tagline}</p></div><button className="flavor-button" onClick={() => openModal({ type: "yogurt", flavor: index })} aria-label={`Choose ${flavor.name} yogurt`}><Icon name="arrow" size={21} /></button></div></article>)}</div><div className="yogurt-footer"><span><Icon name="heart" size={17} /> Made for your feel-good moments.</span><p>Can't pick a favourite? <button onClick={() => openModal({ type: "yogurt", flavor: -1 })}>Make it a trio <Icon name="arrow" size={15} /></button></p></div></section>;
}

function AboutSection() {
  return <section className="about-section" id="about"><div className="container about-layout"><div className="about-heading"><div className="eyebrow">SAME STATION. DIFFERENT GOOD THINGS.</div><h2>Life's a little better<br />with a good pit stop.</h2><span className="about-sparkle" aria-hidden="true">✳</span></div><div className="about-copy"><p>We're 3T Station. A place for the things you love and the little things you need. From your next gaming adventure to giving your phone a second life — with something sweet along the way.</p><p>Three different passions, one simple idea:<br /><strong>make your everyday a little more awesome.</strong></p><div className="about-tags"><span><Icon name="game" size={15} /> Play a little.</span><span><Icon name="tool" size={15} /> Worry less.</span><span><Icon name="stick" size={15} /> Enjoy more.</span></div></div></div></section>;
}

function FaqSection({ openModal }: { openModal: OpenModal }) {
  const faqs = [
    ["How do I top up my game?", "Choose your game and region, enter your player ID, and select or request a package. You can then prepare an enquiry for our team. We'll confirm the current price, payment instructions, and availability before you proceed. Never share your password for a UID top-up."],
    ["How much will my phone repair cost?", "The price depends on your phone model, the issue, and the parts needed. Send a repair enquiry with those details so we can discuss a quote. Any inspection fee, repair timing, and applicable warranty should be confirmed with our team before work begins."],
    ["Which yogurt flavours can I choose?", "Our menu features Mango, Blueberry, and Strawberry yogurt sticks. Pick one favourite or put together a trio! Ask our team about current availability, stick sizes, pricing, ingredients, and collection arrangements."],
    ["What if I have an allergy or dietary requirement?", "Yogurt typically contains dairy. Please check the full ingredient and allergen information with our team before ordering. We cannot currently guarantee allergen-free preparation or make dietary certifications."],
  ];
  return <section className="section container faq-section"><div><div className="eyebrow">GOOD QUESTIONS. SIMPLE ANSWERS.</div><h2>A little curious?</h2><p>We're here to make things easy.</p><button className="text-link" onClick={() => openModal({ type: "contact" })}>Ask us anything <Icon name="diagonal" size={16} /></button></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Icon name="plus" size={18} /></summary><p>{answer}</p></details>)}</div></section>;
}

function Footer({ openModal }: { openModal: OpenModal }) {
  return <><section className="container"><div className="contact-banner"><div><span className="eyebrow">YOUR NEXT GOOD THING STARTS HERE.</span><h2>What can we do for you today?</h2></div><button className="button button-dark" onClick={() => openModal({ type: "contact" })}>Let's have a chat <Icon name="chat" size={19} /></button><span className="banner-decoration" aria-hidden="true">✳</span></div></section><footer className="footer container"><div className="footer-top"><div><Brand footer /><p>Play. Repair. Refresh.<br />Your everyday, a little better.</p></div><div className="footer-column"><h3>Find your station</h3><a href="/topup">Game top-up</a><a href="/#repair">Phone repair</a><a href="/#yogurt">Fresh yogurt</a></div><div className="footer-column"><h3>A little about us</h3><a href="/#about">The 3T story</a><button onClick={() => openModal({ type: "contact" })}>Get in touch <Icon name="diagonal" size={13} /></button><span>Made with a little extra care.</span></div><div className="footer-signoff"><span>Good games.<br />Good as new.<br /><em>Good mood.</em></span><Icon name="sparkle" size={25} /></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} 3T Station. All rights reserved.</span><span>Three good things. One station. <span className="green-text">✳</span></span><a href="#main-content">Back to top ↑</a></div></footer></>;
}

function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const scrollBefore = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = scrollBefore; previousFocus?.focus(); };
  }, []);
  return <dialog ref={dialogRef} className={`modal ${wide ? "modal-wide" : ""}`} aria-labelledby="modal-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}><div className="modal-header"><div><span className="eyebrow">YOUR 3T STATION</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" autoFocus onClick={close} aria-label="Close dialog"><Icon name="close" size={22} /></button></div>{children}</dialog>;
}

function RequestReady({ text, reset }: { text: string; reset: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setCopyError(false); } catch { setCopyError(true); } };
  return <div className="request-ready"><span className="ready-icon"><Icon name="check" size={30} /></span><h3>Your enquiry is ready.</h3><p>This is a draft — nothing has been sent and no payment has been taken.</p><label>Your request<textarea className="request-text" readOnly rows={8} value={text} onFocus={e => e.target.select()} /></label>{business.whatsapp ? <a className="button full-width" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Continue in WhatsApp <Icon name="chat" size={18} /></a> : <div className="form-notice"><Icon name="info" size={18} /><span>Our online contact details are being set up. Copy your request to keep it for later. No order or booking has been placed.</span></div>}<button className="button button-outline full-width" onClick={copy}><Icon name={copied ? "check" : "copy"} size={17} />{copied ? "Copied to clipboard" : "Copy enquiry"}</button><span role="status" className="copy-status">{copyError ? "Clipboard unavailable. Select and copy the text above manually." : copied ? "Your enquiry has been copied." : ""}</span><button className="text-link" onClick={reset}>← Edit my enquiry</button></div>;
}

function ContactFields() {
  return <div className="form-two-columns"><label>Your name<input name="name" required maxLength={80} autoComplete="name" placeholder="What should we call you?" /></label><label>Phone / WhatsApp<input name="phone" required type="tel" pattern="[+0-9() .\-]{7,20}" title="Enter a phone number with 7–20 characters, using digits, spaces, +, -, or parentheses." autoComplete="tel" placeholder="e.g. 012 345 6789" /></label></div>;
}

const value = (data: FormData, key: string) => String(data.get(key) || "").trim();

function TopupForm({ game }: { game: Game }) {
  const [pack, setPack] = useState("");
  const [ready, setReady] = useState("");
  const viaLogin = game.category === "Via Login";
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setReady(`Hi 3T Station! I'd like to enquire about a game top-up.\n\nGame: ${game.name}\nRegion: ${game.region}\n${viaLogin ? "Please advise on safe top-up options.\n" : `Player ID: ${value(data, "uid")}\n${value(data, "server") ? `Server ID: ${value(data, "server")}\n` : ""}`}Package: ${pack || value(data, "package")}\nName: ${value(data, "name")}\nContact: ${value(data, "phone")}\n\nPlease confirm availability, the current price, and payment instructions.`);
  };
  return <><div hidden={!!ready}><form className="enquiry-form" onSubmit={submit}><div className="selected-game"><GameImage game={game} /><div><h3>{game.name}</h3><span>{game.region} · {game.category}</span></div><Icon name="game" size={28} /></div>{viaLogin ? <div className="form-notice"><Icon name="shield" /><span>Ask our team about safe options for this service. Do not send passwords, verification codes, or recovery details.</span></div> : <><h3 className="form-step"><span>1</span> Your player details</h3><div className="form-two-columns"><label>Player / User ID<input name="uid" required pattern="[0-9]{4,20}" title="Enter a player ID with 4–20 digits." inputMode="numeric" placeholder="Enter your in-game ID" /></label>{game.slug.startsWith("mobile-legends") || game.slug.startsWith("magic-chess") ? <label>Server / Zone ID<input name="server" required pattern="[0-9]{3,10}" title="Enter a server ID with 3–10 digits." inputMode="numeric" placeholder="e.g. 1234" /></label> : <label>Server / Region (optional)<input name="server" placeholder="Your server, if applicable" maxLength={50} /></label>}</div><p className="field-hint">Double-check your ID in your in-game profile. We never need your password.</p></>}
      <fieldset className="package-fieldset"><legend className="form-step"><span>{viaLogin ? "1" : "2"}</span> Select denomination</legend><div className="package-grid">{topupPackages.map(([name, price]) => <label className={`package-option ${pack === `${name} — RM ${price}` ? "selected" : ""}`} key={name}><input type="radio" name="package" required value={`${name} — RM ${price}`} checked={pack === `${name} — RM ${price}`} onChange={event => setPack(event.target.value)} /><Icon name="bolt" size={20} /><span><strong>{name}</strong><small>RM {price}</small></span></label>)}</div></fieldset><p className="field-hint">Package availability and current prices will be confirmed by our team.</p><h3 className="form-step"><span>{viaLogin ? "2" : "3"}</span> How can we reach you?</h3><ContactFields /><p className="privacy-note">Your details stay in this browser until you choose to share the enquiry. This is not a live checkout.</p><button className="button full-width" type="submit">Prepare top-up enquiry <Icon name="arrow" size={18} /></button></form></div>{ready && <RequestReady text={ready} reset={() => setReady("")} />}</>;
}

function RepairForm({ issue }: { issue: string }) {
  const [ready, setReady] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setReady(`Hi 3T Station! I'd like a phone repair quote.\n\nPhone: ${value(data, "brand")} ${value(data, "model")}\nIssue: ${value(data, "issue")}\nDetails: ${value(data, "details") || "No additional details"}\nName: ${value(data, "name")}\nContact: ${value(data, "phone")}\n\nPlease let me know the next steps, any diagnosis fee, and the estimated cost and turnaround time.`); };
  return <><div hidden={!!ready}><form className="enquiry-form" onSubmit={submit}><p className="modal-intro">A little detail goes a long way. Tell us what happened and let's work out the next step.</p><div className="form-two-columns"><label>Phone brand<select name="brand" required defaultValue=""><option value="" disabled>Select your brand</option>{["Apple", "Samsung", "Xiaomi / Redmi", "OPPO", "vivo", "realme", "HONOR", "Huawei", "Google", "Other"].map(brand => <option key={brand}>{brand}</option>)}</select></label><label>Phone model<input name="model" required maxLength={80} placeholder="e.g. iPhone 14" /></label></div><label>What needs a little care?<select name="issue" defaultValue={issue}>{repairs.map(repair => <option key={repair.name}>{repair.name}</option>)}</select></label><label>Tell us a little more <span className="optional">(optional)</span><textarea name="details" rows={3} maxLength={1000} placeholder="What happened? When did you first notice it?" /></label><ContactFields /><div className="form-notice"><Icon name="info" size={18} /><span>This prepares a quote request, not a confirmed appointment. Pricing, parts, timing, and any warranty are subject to assessment.</span></div><p className="privacy-note">Details stay in your browser until you choose to share them. Please don't include passwords or sensitive device data.</p><button type="submit" className="button full-width">Prepare repair enquiry <Icon name="arrow" size={18} /></button></form></div>{ready && <RequestReady text={ready} reset={() => setReady("")} />}</>;
}

function YogurtForm({ initialFlavor }: { initialFlavor: number }) {
  const [quantities, setQuantities] = useState<number[]>(flavors.map((_, index) => initialFlavor === -1 || initialFlavor === index ? 1 : 0));
  const [ready, setReady] = useState("");
  const total = quantities.reduce((sum, qty) => sum + qty, 0);
  const change = (index: number, amount: number) => setQuantities(current => current.map((qty, i) => i === index ? Math.max(0, Math.min(20, qty + amount)) : qty));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!total) return; const data = new FormData(event.currentTarget); setReady(`Hi 3T Station! I'd like to ask about yogurt.\n\n${flavors.map((flavor, index) => quantities[index] ? `${flavor.name}: ${quantities[index]} stick${quantities[index] === 1 ? "" : "s"}` : "").filter(Boolean).join("\n")}\nTotal: ${total} stick${total === 1 ? "" : "s"}\nName: ${value(data, "name")}\nContact: ${value(data, "phone")}\nNotes: ${value(data, "notes") || "None"}\n\nPlease confirm availability, stick sizes, ingredients, pricing, and collection arrangements before placing an order.`); };
  return <><div hidden={!!ready}><form className="enquiry-form" onSubmit={submit}><p className="modal-intro">One favourite or a little of everything? Build your happy little selection.</p><div className="yogurt-order-items">{flavors.map((flavor, index) => <div className={`yogurt-order-row ${flavor.slug}`} key={flavor.slug}><img src={flavor.image} alt={`${flavor.name} yogurt stick`} /><div className="yogurt-order-info"><h3>{flavor.name}</h3><p>{flavor.tagline}</p></div><div className="quantity-control"><button type="button" aria-label={`Remove one ${flavor.name}`} onClick={() => change(index, -1)} disabled={!quantities[index]}><Icon name="minus" size={15} /></button><output aria-label={`${flavor.name} quantity`} aria-live="polite">{quantities[index]}</output><button type="button" aria-label={`Add one ${flavor.name}`} disabled={quantities[index] >= 20} onClick={() => change(index, 1)}><Icon name="plus" size={15} /></button></div></div>)}</div><div className="yogurt-total"><span>Your little happiness haul</span><strong>{total} stick{total !== 1 ? "s" : ""}</strong></div><ContactFields /><label>Notes or dietary questions <span className="optional">(optional)</span><textarea name="notes" rows={2} maxLength={500} placeholder="Ask about ingredients, collection, or special requests" /></label><div className="form-notice"><Icon name="info" size={18} /><span>Contains dairy. Confirm ingredients and allergens with our team before ordering. Prices, sizes, and availability are confirmed on enquiry.</span></div><p className="privacy-note">No order is placed here. Details stay in your browser until you share your enquiry.</p><button type="submit" className="button full-width" disabled={total === 0}>Ask about my {total || ""} stick{total !== 1 ? "s" : ""} <Icon name="arrow" size={18} /></button></form></div>{ready && <RequestReady text={ready} reset={() => setReady("")} />}</>;
}

function Contact({ openModal }: { openModal: OpenModal }) {
  return <div className="contact-modal"><p className="modal-intro">Whatever brings you to our station, we're happy you're here. What can we help with?</p><div className="contact-options"><a href="/topup"><span className="service-icon green"><Icon name="game" size={22} /></span><span><strong>Power up my game</strong><small>Browse the game top-up catalogue</small></span><Icon name="arrow" size={18} /></a>{[{ icon: "screen", title: "Give my phone a fresh start", copy: "Prepare a repair quote request", action: () => openModal({ type: "repair", issue: "Screen repair" }) }, { icon: "stick", title: "Find something sweet", copy: "Choose your yogurt flavours", action: () => openModal({ type: "yogurt", flavor: -1 }) }].map(item => <button key={item.title} onClick={item.action}><span className="service-icon green"><Icon name={item.icon} size={22} /></span><span><strong>{item.title}</strong><small>{item.copy}</small></span><Icon name="arrow" size={18} /></button>)}</div>{business.whatsapp && <a className="button full-width" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hi 3T Station! I'd like to know more.")}`} target="_blank" rel="noreferrer"><Icon name="chat" size={18} /> Chat on WhatsApp</a>}{business.email && <a className="contact-email" href={`mailto:${business.email}`}>{business.email}</a>}{business.address && <p className="contact-address">Visit us: {business.address}</p>}{!business.whatsapp && !business.email && <div className="form-notice"><Icon name="info" size={18} /><span>Our contact details and store information are coming soon. You can explore our services and prepare an enquiry in the meantime.</span></div>}</div>;
}

const repairModels = ["iPhone 11", "iPhone 13", "iPhone 15", "Galaxy S23", "Galaxy A54", "Redmi Note 13"];
const repairPrices: Record<string, [string, string][]> = {
  "iPhone 11": [["Battery replacement", "RM 160"], ["LCD screen replacement", "RM 400"], ["Charging port replacement", "RM 150"], ["Back camera replacement", "RM 180"], ["Motherboard repair", "RM 250–350"]],
  "iPhone 13": [["Battery replacement", "RM 200"], ["LCD screen replacement", "RM 550"], ["Charging port replacement", "RM 180"], ["Back camera replacement", "RM 220"], ["Motherboard repair", "RM 450–600"]],
  "iPhone 15": [["Battery replacement", "RM 250"], ["Screen replacement", "RM 800"], ["Charging port replacement", "RM 220"], ["Back glass repair", "RM 400"], ["Motherboard repair", "RM 600–800"]],
  "Galaxy S23": [["Battery replacement", "RM 180"], ["LCD screen replacement", "RM 650"], ["Charging port replacement", "RM 180"], ["Back camera replacement", "RM 250"], ["Motherboard repair", "RM 450–650"]],
};

function RepairPage() {
  const [model, setModel] = useState(repairModels[0]);
  const [issue, setIssue] = useState("Screen repair");
  const prices = repairPrices[model] || [["Battery replacement", "From RM 120"], ["Screen replacement", "From RM 250"], ["Charging port replacement", "From RM 100"], ["Camera replacement", "From RM 120"], ["Other issue", "Ask for a quote"]];
  return <main id="main-content" className="repair-page"><section className="repair-page-hero"><div className="container repair-page-hero-inner"><div><div className="eyebrow"><span className="section-index">3T /</span> THE FIX STATION</div><h1>Get your device<br /><span>fixed today.</span></h1><p>Cracked screen, tired battery, or a mystery problem? Tell us what happened. We’ll help you find a clear next step.</p><a className="button button-dark" href="#repair-pricing">Find my repair <Icon name="arrow" size={18} /></a><div className="repair-page-proof"><span><Icon name="shield" size={17} /> Clear quote first</span><span><Icon name="bolt" size={17} /> Same-day options</span><span><Icon name="heart" size={17} /> Care, not pressure</span></div></div><div className="repair-page-art"><PhoneArt /><span className="repair-page-art-note">GOOD AS NEW<br /><strong>STARTS HERE.</strong></span></div></div></section><section className="repair-steps container"><div className="repair-step"><span>01</span><Icon name="screen" size={22} /><div><h3>Choose your device</h3><p>Find the closest model match.</p></div></div><div className="repair-step"><span>02</span><Icon name="tool" size={22} /><div><h3>Pick the problem</h3><p>Tell us what needs attention.</p></div></div><div className="repair-step"><span>03</span><Icon name="chat" size={22} /><div><h3>Get a clear next step</h3><p>Request a quote before work begins.</p></div></div></section><section className="repair-device-section container" id="repair-pricing"><div className="repair-page-heading"><div><div className="eyebrow"><span className="section-index">01 /</span> FIND YOUR DEVICE</div><h2>Let’s start with<br /><span>what you carry.</span></h2></div><p>Prices below are estimates. We’ll confirm the exact part, condition, timing, and final quote with you.</p></div><label className="repair-model-label">Select your model<select value={model} onChange={event => setModel(event.target.value)}>{repairModels.map(item => <option key={item}>{item}</option>)}</select></label><div className="repair-pricing-card"><div className="repair-pricing-head"><div><div className="eyebrow"><Icon name="tag" size={15} /> ESTIMATED SERVICE MENU</div><h2>Simple, transparent pricing<span className="green-text">.</span></h2><p>{model} · indicative prices in RM</p></div><span className="repair-price-mark">RM<br /><strong>↗</strong></span></div><div className="repair-price-table">{prices.map(([service, price]) => <button className="repair-price-row" key={service} onClick={() => setIssue(service)}><span><strong>{service}</strong><small>Confirm after diagnosis</small></span><b>{price}</b><Icon name="arrow" size={17} /></button>)}</div><div className="repair-price-foot"><Icon name="info" size={15} /> Final price depends on inspection, model, part quality, and availability.</div></div><button className="button" onClick={() => document.getElementById("repair-request")?.scrollIntoView({ behavior: "smooth" })}>Request a quote for {model} <Icon name="arrow" size={18} /></button></section><section className="repair-process"><div className="container repair-process-grid"><div><div className="eyebrow"><span className="section-index">02 /</span> HOW IT WORKS</div><h2>Easy from<br /><span>start to finish.</span></h2><p>No confusing jargon. No surprise work. We explain the issue, options, timing, and price before repair begins.</p></div><div className="repair-process-list"><article><b>01</b><div><h3>Bring it in or enquire first</h3><p>Start with a message and a few details. We can discuss availability before you make the trip.</p></div></article><article><b>02</b><div><h3>We check the device</h3><p>We explain the issue, options, estimated timing, and price before repair begins.</p></div></article><article><b>03</b><div><h3>Get back to your day</h3><p>Once you approve the work, we repair it and explain any care or warranty terms that apply.</p></div></article></div></div></section><section className="container repair-request" id="repair-request"><div><div className="eyebrow">03 / SEND THE DETAILS</div><h2>Ready when you are.</h2><p>Share your model and issue. The form prepares a quote request; it does not book or charge you.</p></div><RepairForm issue={issue} /></section><section className="container repair-page-disclaimer"><Icon name="info" size={18} /><p>Prices shown are planning estimates. Parts, model variants, water damage, board-level work, diagnosis fees, and warranty terms vary. Confirm everything before repair.</p></section></main>;
}

export default function App() {
  const [modal, setModal] = useState<ModalState>(null);
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const isTopup = path === "/topup" || path.startsWith("/topup/");
  const isRepair = path === "/repair";
  const titles = { repair: "A fresh start for your phone.", yogurt: "Pick your happy.", contact: "Hey there. Let's talk." };
  useEffect(() => {
    const onNavigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[href]");
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !link || link.hasAttribute("download") || (link.getAttribute("target") && link.getAttribute("target") !== "_self") || document.querySelector("dialog[open]")) return;
      const destination = new URL(link.getAttribute("href")!, location.href);
      if (destination.origin !== location.origin || destination.pathname === location.pathname || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      event.preventDefault();
      document.documentElement.classList.add("page-leaving");
      setTimeout(() => location.assign(destination.href), 150);
    };
    document.addEventListener("click", onNavigate);
    const onPageShow = () => document.documentElement.classList.remove("page-leaving");
    window.addEventListener("pageshow", onPageShow);
    return () => { document.removeEventListener("click", onNavigate); window.removeEventListener("pageshow", onPageShow); };
  }, []);
  useEffect(() => { document.title = isTopup ? `${path === "/topup" ? "Game Top-up" : path.includes("/order/") ? "Top-up Enquiry" : path === "/topup/calculator" ? "Win Rate Calculator" : path === "/topup/check-region" ? "Check ID Format" : "Track Order"} — 3T Station` : "3T Station — Play. Repair. Refresh."; }, [path, isTopup]);
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header openModal={setModal} />{isTopup ? <TopupPage path={path} /> : isRepair ? <RepairPage /> : <main id="main-content"><Hero /><Services /><GameSection /><RepairSection /><YogurtSection openModal={setModal} /><AboutSection /><FaqSection openModal={setModal} /></main>}<Footer openModal={setModal} />{modal && <Modal key={modal.type} title={titles[modal.type]} close={() => setModal(null)}>{modal.type === "repair" && <RepairForm issue={modal.issue} />}{modal.type === "yogurt" && <YogurtForm initialFlavor={modal.flavor} />}{modal.type === "contact" && <Contact openModal={setModal} />}</Modal>}</>;
}
