import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-mark">Painted with patience.</p>
        <nav className="footer-links">
          <Link to="/projects">Projects</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Write a letter</Link>
        </nav>
        <p className="footer-note">
          © {new Date().getFullYear()} Nguyen Hieu Kien. Independent designer & illustrator.
        </p>
      </div>
    </footer>
  );
}
