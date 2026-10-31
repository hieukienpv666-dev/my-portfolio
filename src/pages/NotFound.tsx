import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <section className="prose lost">
      <p className="eyebrow">404</p>
      <h1>The path faded into the grass.</h1>
      <p className="lede">
        This page has wandered off, the way a trail does after rain. The
        studio is still just over the hill.
      </p>
      <Link className="btn" to="/">
        Walk home
      </Link>
    </section>
  );
}
