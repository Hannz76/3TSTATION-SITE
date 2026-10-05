import { founders } from "./founders";
import "./About.css";

export default function About() {
  return <section className="company-about" id="about" aria-labelledby="company-about-title">
    <div className="container">
      <div className="company-introduction">
        <div><span className="eyebrow">ABOUT 3T STATION</span><h2 id="company-about-title">Three businesses.<br />One <span>station.</span></h2></div>
        <div className="company-description"><p>3T Station brings game top-ups, phone repair services, and fresh yogurt together in one place. We connect the things you enjoy with the services you need, making room for more play, a little care, and a sweet break.</p><p>Behind each business is a founder with a clear focus. Together, Muiz, Sidqi, and Syabil bring our three services to life.</p><div className="company-businesses" aria-label="Our businesses"><span>01 / Game top-up</span><span>02 / Phone repair</span><span>03 / Fresh yogurt</span></div></div>
      </div>
      <div className="founders-heading"><div><span className="eyebrow">THE PEOPLE BEHIND 3T</span><h3>Meet our founders.</h3></div><p>Three people. A shared commitment to our station.</p></div>
      <div className="founder-grid">{founders.map((founder, index) => <article className={`founder-card founder-${founder.id}`} key={founder.id}>
        <div className="founder-portrait"><img src={founder.image} alt={`${founder.name}, ${founder.role} at 3T Station`} loading="lazy" width={founder.width} height={founder.height} /><span className="founder-business-label"><span aria-hidden="true">0{index + 1}</span>{founder.business}</span></div>
        <div className="founder-details"><span className="founder-role">{founder.role}</span><h4>{founder.name}</h4><p>{founder.description}</p><a className="text-link" href={founder.href}>{founder.linkLabel}<span aria-hidden="true">↗</span></a></div>
      </article>)}</div>
    </div>
  </section>;
}
