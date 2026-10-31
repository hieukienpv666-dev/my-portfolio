export function About() {
  return (
    <article className="prose about-page">
      <video
        className="about-background-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/media/the-sixth-station.mp4" type="video/mp4" />
      </video>
      <p className="eyebrow">About / Nguyen Hieu Kien</p>
      <h1>Ideas made visible,<br /><em>with care.</em></h1>
      <p className="lede">
        I am an Information Technology student at Electric Power University,
        approaching Game UI/UX design through logical thinking, curiosity,
        and close attention to how players interact.
      </p>
      <div className="split">
        <img src="/about-portrait.jpg" alt="Nguyen Hieu Kien" />
        <div>
          <p>
            A passionate IT major at Electric Power University who loves
            connecting the dots with strong logical thinking and crafting
            awesome user experiences for the gaming world! Looking to
            kick off a long-term journey as a Game UI/UX Designer Intern.
            Ready to mix solid user flows and information architecture
            with design magic to help build intuitive, buttery-smooth, and
            player-friendly gaming experiences!
          </p>
          <ul className="facts">
            <li>
              <strong>Based in</strong> Hanoi, Vietnam
            </li>
            <li>
              <strong>Tools</strong> Figma, Miro, wireframing
            </li>
            <li>
              <strong>Interested in</strong> Game UI/UX Design
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}
