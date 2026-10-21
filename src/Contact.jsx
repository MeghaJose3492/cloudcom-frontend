import { useState } from "react";
import { sendInquiry } from "./Api";
import { Section, Head, Reveal } from "./ui";

// 👉 Replace with your real details
const COMPANY = {
  name: "CloudCom",
  address: "Your street address, City, State, PIN",
  phone: "+91 00000 00000",
  email: "hello@cloudcom.example",
  hours: [["Monday – Saturday", "10:00 AM – 7:00 PM"], ["Sunday", "Closed"]],
  mapQuery: "CloudCom, Your street address, City",
  social: [["Instagram", "#"], ["Facebook", "#"], ["LinkedIn", "#"], ["WhatsApp", "#"]],
};
const EMPTY = { name: "", email: "", phone: "", subject: "", message: "", website: "" };

export default function Contact() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [st, setSt] = useState("idle"); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState("");
  const on = (k) => (e) => {
    setF((current) => ({ ...current, [k]: e.target.value }));
    setErrors((current) => ({ ...current, [k]: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (f.website) return; // honeypot
    const nextErrors = {};
    const email = f.email.trim();
    if (!f.name.trim()) nextErrors.name = "Name is required.";
    if (!email) nextErrors.email = "Email is required.";
    else if (!/^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) nextErrors.email = "Enter a valid email address.";
    if (f.phone && !/^\+?[0-9]+(?: [0-9]+){0,2}$/.test(f.phone)) {
      nextErrors.phone = "Use only +, numbers, and up to two spaces.";
    }
    if (!f.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!f.message.trim()) nextErrors.message = "Message is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSt("sending");
    setErrorMessage("");
    try {
      const { website, ...body } = f;
      body.email = email;
      await sendInquiry(body); // general inquiry — not a service booking
      setSt("sent");
      setF(EMPTY);
    } catch (error) {
      setSt("error");
      setErrorMessage(error.message || "We couldn't send your message. Please try again shortly.");
    }
  };

  return (
    <Section id="contact" alt>
      <Head eyebrow="Get in touch" title="Contact Us" lead="Questions about a product, a quote or a service? Send us a message and we'll get back to you." />
      <div className="contact">
        <div className="contact__info">
          <Reveal className="card info">
            <h3>{COMPANY.name}</h3>
            <p>{COMPANY.address}</p>
            <p><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a></p>
            <p><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
            <dl className="hours">
              {COMPANY.hours.map(([d, t]) => <div key={d}><dt>{d}</dt><dd>{t}</dd></div>)}
            </dl>
            <div className="social">
              {COMPANY.social.map(([n, h]) => <a key={n} href={h} target="_blank" rel="noreferrer">{n}</a>)}
            </div>
          </Reveal>
          <Reveal i={2} className="map">
            <iframe title="CloudCom location" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(COMPANY.mapQuery)}&output=embed`} />
          </Reveal>
        </div>

        <Reveal i={1} as="form" className="card form" onSubmit={submit} noValidate>
          <h3>Send an inquiry</h3>
          <label className="field"><span>Name</span><input required value={f.name} onChange={on("name")} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} />{errors.name && <small id="contact-name-error" className="field-error">{errors.name}</small>}</label>
          <div className="row">
            <label className="field"><span>Email</span><input required type="email" value={f.email} onChange={on("email")} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} />{errors.email && <small id="contact-email-error" className="field-error">{errors.email}</small>}</label>
            <label className="field"><span>Phone</span><input type="tel" value={f.phone} onChange={on("phone")} autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "contact-phone-error" : undefined} />{errors.phone && <small id="contact-phone-error" className="field-error">{errors.phone}</small>}</label>
          </div>
          <label className="field"><span>Subject</span><input required value={f.subject} onChange={on("subject")} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "contact-subject-error" : undefined} />{errors.subject && <small id="contact-subject-error" className="field-error">{errors.subject}</small>}</label>
          <label className="field"><span>Message</span><textarea required rows={5} value={f.message} onChange={on("message")} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} />{errors.message && <small id="contact-message-error" className="field-error">{errors.message}</small>}</label>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={on("website")} />
          <button className="btn-metal" disabled={st === "sending"}>{st === "sending" ? "Sending…" : "Send message"}</button>
          <p className={`note note--${st}`} role="status">
            {st === "sent" && "Thank you — your message has been sent."}
            {st === "error" && (errorMessage || "Sorry, we couldn't send that. Please try again or call us.")}
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
