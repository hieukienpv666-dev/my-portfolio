import { Link } from "react-router-dom";
import { projects } from "../data/projects";

export function Projects() {
  return (
    <section className="archive-page">
      <div className="archive-heading">
        <p className="archive-index">Chocolate ByNa / 01—{String(projects.length).padStart(2, "0")}</p>
        <h1>Selected<br /><em>works.</em></h1>
        <p className="archive-intro">A bilingual e-commerce experience for Chocolate ByNa, a neighborhood cake shop with a playful, thoughtful visual identity.</p>
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
