import { Link, useParams } from "react-router-dom";
import { getProject, projects } from "../data/projects";

export function ProjectDetail() {
  const { id } = useParams();
  const project = id ? getProject(id) : undefined;

  if (!project) {
    return (
      <section className="prose">
        <h1>This path has grown over.</h1>
        <p>That project is not in the garden anymore.</p>
        <Link className="btn" to="/projects">
          Back to projects
        </Link>
      </section>
    );
  }

  const next =
    projects[(projects.findIndex((item) => item.id === project.id) + 1) % projects.length];

  return (
    <article className="detail">
      <p className="eyebrow">
        {project.year} · {project.role}
      </p>
      <h1>{project.title}</h1>
      <p className="lede">{project.summary}</p>
      <ul className="tags">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <img
        className="full-bleed"
        src={project.cover.src}
        alt={project.cover.alt}
      />
      <p className="description">{project.description}</p>
      {project.gallery.map((image) => (
        <figure key={image.src} className="full-figure">
          <img className="full-bleed" src={image.src} alt={image.alt} />
          <figcaption>{image.alt}</figcaption>
        </figure>
      ))}
      <div className="detail-nav">
        <Link to="/projects">All projects</Link>
        <Link to={`/projects/${next.id}`}>Next: {next.title}</Link>
      </div>
    </article>
  );
}
