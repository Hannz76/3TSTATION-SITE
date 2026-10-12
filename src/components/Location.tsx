import "./Location.css";

export default function Location() {
  return <section id="location" className="location-section container" aria-labelledby="location-title">
    <div className="location-copy">
      <span className="eyebrow">FIND US</span>
      <h2 id="location-title">TVETMARA Besut</h2>
      <p>Jalan Batu Tumbuh, Alur Lintang,<br />22200 Besut, Terengganu.</p>
      <a className="button button-outline" href="https://maps.app.goo.gl/LGTEzpV27wxGnEAe6" target="_blank" rel="noopener noreferrer">Get directions <span aria-hidden="true">↗</span></a>
    </div>
    <iframe className="location-map" title="Google Maps location of TVETMARA Besut" src="https://maps.google.com/maps?q=TVETMARA%20Besut&ll=5.7643176,102.5586187&z=16&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
  </section>;
}
