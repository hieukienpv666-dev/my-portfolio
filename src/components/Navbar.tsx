import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Link className="nav-logo" to="/" aria-label="Nguyen Hieu Kien home">
        <img src="/kikis-logo.png" alt="" />
      </Link>
      <button
        className="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-label="Toggle menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
      <nav className={open ? "nav-links is-open" : "nav-links"}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
