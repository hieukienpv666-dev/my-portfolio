import { Link } from "react-router-dom";

const artworks = [
  { src: "/home-art/floating-spirits.jpg", alt: "Two figures floating above a blue landscape" },
  { src: "/home-art/rose-house.jpg", alt: "A flower-covered house surrounded by lush greenery" },
  { src: "/home-art/alpine-lake.jpg", alt: "A blue alpine lake beneath snowy mountains" },
  { src: "/home-art/valley-cottage.jpg", alt: "A cottage beside a flowered valley stream" },
];

export function Home() {
  return (
    <>
      <section className="sky-hero">
        <div className="sky-cloud cloud-one" />
        <div className="sky-cloud cloud-two" />
        <div className="sky-cloud cloud-three" />
        <div className="sky-hero-top">
          <span>Independent creative designer</span>
          <span>Portfolio · 2026</span>
        </div>
        <div className="sky-wordmark" aria-label="Nguyen Hieu Kien">
          <span>NGUYEN HIEU</span>
          <span>KIEN</span>
        </div>
        <div className="cinematic-frame">
          <video
            className="cinematic-image"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-label="Animated flower field landscape"
          >
            <source src="/media/flower-field.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="sky-hero-note">
          <span className="sky-number">01</span>
          <p>I shape visual worlds through identity, illustration and thoughtful digital experiences.</p>
          <Link to="/projects">Discover the work <b>↗</b></Link>
        </div>
      </section>

      <section className="calendar-section">
        <div className="calendar-heading">
          <p>Selected artwork</p>
        </div>
        <div className="calendar-grid">
          {artworks.map((artwork, index) => (
            <div key={artwork.src} className="calendar-card">
              <div className="calendar-image">
                <img src={artwork.src} alt={artwork.alt} />
                <span className="calendar-number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="calendar-meta">
                <span>ARTWORK</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="manifesto">
        <p className="manifesto-label">In practice</p>
        <p className="manifesto-text">
          Making work that feels <em>human,</em><br />
          useful and quietly memorable.
        </p>
        <Link className="round-link" to="/contact" aria-label="Start a project">↗</Link>
      </section>
    </>
  );
}
