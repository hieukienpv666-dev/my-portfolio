const services = [
  {
    title: "Art direction",
    text: "A north star for a brand or exhibition: palette, paper, and the feeling people should have when they arrive.",
    video: "/media/services/shou-relaxing-flower-field-the-secret-world-of-arrietty-moewalls-com.mp4",
  },
  {
    title: "Illustration",
    text: "Watercolor landscapes, character-free worldbuilding, and editorial pictures that still look handmade on a screen.",
    video: "/media/services/sophie-making-hats-howls-moving-castle-moewalls-com.mp4",
  },
  {
    title: "Gentle websites",
    text: "Small sites with clear type, slow motion, and room to breathe—built so the pictures stay the loudest thing.",
    video: "/media/services/totoro-in-the-rain-moewalls-com.mp4",
  },
  {
    title: "Print & packaging",
    text: "Menus, lantern posters, tea tins, and catalog cards that feel good to hold.",
    video: "/media/services/howls-moving-castle-moewalls-com.mp4",
  },
];

export function Services() {
  return (
    <section className="section">
      <p className="eyebrow">Services / What I do</p>
      <h1>From first idea<br /><em>to final form.</em></h1>
      <p className="lede">
        I take a few collaborations at a time. If your project needs weather,
        paper, and a quiet digital home, we will likely get along.
      </p>
      <div className="service-grid">
        {services.map((service) => (
          <article key={service.title} className="service-card">
            <video
              className="service-card-video"
              src={service.video}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
            <div className="service-card-content">
              <h2>{service.title}</h2>
              <p>{service.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
