import { Link } from "react-router-dom";
import { projects } from "../data/projects";

const shopScreenshots = Array.from({ length: 7 }, (_, index) => ({
  src: `/projects/chocolate-byna/showcase/shop-screen-${String(index + 1).padStart(2, "0")}.png`,
  alt: `Chocolate ByNa cake shop website screenshot ${index + 1}`,
}));

export function Projects() {
  return (
    <section className="archive-page">
      <section className="shop-showcase" aria-labelledby="shop-showcase-title">
        <div className="shop-showcase-intro">
          <div className="shop-showcase-logo">
            <img
              src="/projects/chocolate-byna/showcase/shop-logo.png"
              alt="Chocolate ByNa cakes logo"
            />
          </div>
          <div className="shop-showcase-copy">
            <p className="shop-showcase-kicker">Featured project · 2026</p>
            <h1 id="shop-showcase-title">Chocolate ByNa <em>cakes.</em></h1>
            <p>
              A warm, bilingual online shop for a neighborhood bakery—bringing
              its playful cat mascot, handmade treats, and easy pickup ordering
              together in one friendly experience.
            </p>
            <ul className="shop-showcase-tags" aria-label="Project services">
              <li>Brand identity</li>
              <li>E-commerce</li>
              <li>Responsive design</li>
            </ul>
          </div>
        </div>
        <div className="shop-showcase-gallery" aria-label="Chocolate ByNa shop screenshots">
          {shopScreenshots.map((image, index) => (
            <figure key={image.src} className="shop-showcase-shot">
              <img src={image.src} alt={image.alt} loading="lazy" />
              <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className="archive-heading">
        <p className="archive-index">Explore the project / 01—{String(projects.length).padStart(2, "0")}</p>
        <h2>Behind the<br /><em>experience.</em></h2>
        <p className="archive-intro">Explore the brand, shopping journey, product visuals, and responsive system behind the Chocolate ByNa shop.</p>
      </div>
      <div className="project-archive">
        {projects.map((project, index) => (
          <Link key={project.id} className="archive-card" to={`/projects/${project.id}`}>
            <span className="archive-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="archive-image"><img src={project.cover.src} alt={project.cover.alt} /></div>
            <div className="archive-copy">
              <p>{project.year} · {project.tags.join(" / ")}</p>
              <h2>{project.title}</h2>
              <span>View project ↗</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
