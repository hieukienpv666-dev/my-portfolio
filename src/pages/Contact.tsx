import { type FormEvent, useState } from "react";

export function Contact() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=hieukienpv999@gmail.com&su=${subject}&body=${body}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  }

  return (
    <section className="prose contact">
      <p className="eyebrow">Contact / Available for work</p>
      <h1>Let’s make<br /><em>something memorable.</em></h1>
      <p className="lede">
        Have a project, collaboration or a wonderfully strange idea? Tell me about it.
      </p>
      {sent ? (
        <p className="thanks">
          Thank you. The wind has the letter now—I will write back soon.
        </p>
      ) : (
        <form className="letter" onSubmit={onSubmit}>
          <label>
            Name
            <input name="name" type="text" required autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            The work you have in mind
            <textarea name="message" rows={6} required />
          </label>
          <button className="btn" type="submit">
            Send enquiry ↗
          </button>
        </form>
      )}
      <p className="fineprint">
        Prefer mail clients?{" "}
        <a href="mailto:hieukienpv999@gmail.com">hieukienpv999@gmail.com</a>
        {" · "}
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=hieukienpv999@gmail.com"
          target="_blank"
          rel="noreferrer"
        >
          Open Gmail
        </a>
      </p>
      <p className="fineprint">
        Phone: <a href="tel:+84962211979">0962211979</a>
      </p>
    </section>
  );
}
