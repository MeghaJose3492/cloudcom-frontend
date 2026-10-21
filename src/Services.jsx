import { useState } from "react";
import { useItems, money, SERVICES_DEMO } from "./Api";
import { Section, Head, Reveal, Img, Skeletons, tilt } from "./ui";

export default function Services() {
  const { loading, items, demo } = useItems("SERVICE", SERVICES_DEMO);
  const [gst, setGst] = useState(true);

  return (
    <Section id="services">
      <Head
        eyebrow="What we do"
        title="Our Services"
        lead="From quick fixes to complete rebuilds — dependable computer and laptop services with clear, upfront pricing."
      />
      <div className="bar">
        <button className={`chip ${gst ? "is-on" : ""}`} aria-pressed={gst} onClick={() => setGst(!gst)}>
          GST breakup: {gst ? "On" : "Off"}
        </button>
      </div>

      {loading ? <Skeletons /> : items.length === 0 ? (
        <p className="empty">No services are available right now.</p>
      ) : (
        <ul className="grid">
          {items.map((s, i) => (
            <Reveal as="li" i={i} key={s.id}>
              <article className="card" {...tilt()}>
                <div className="card__media"><Img src={s.image} alt={s.name} /></div>
                <div className="card__body">
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                  <div className="price"><small>Starting at</small><b>{money(s.price)}</b></div>
                  {gst && (s.cgst > 0 || s.sgst > 0) && (
                    <p className="tax">
                      + CGST {s.cgst}% + SGST {s.sgst}% · Total {money(s.price * (1 + (s.cgst + s.sgst) / 100))}
                    </p>
                  )}
                </div>
                <i className="card__glare" />
              </article>
            </Reveal>
          ))}
        </ul>
      )}
      {demo && process.env.NODE_ENV !== "production" && <p className="demo">Showing sample data — API not reachable.</p>}
    </Section>
  );
}
