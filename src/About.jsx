import { Section, Head, Reveal, CountUp, tilt } from "./ui";

// 👉 Static for now — replace with real company details / numbers
const PILLARS = [
  ["01", "Computer Sales", "Laptops, desktops and all-in-ones from trusted brands, matched to how you work."],
  ["02", "Custom PC Building", "Hand-built, cable-managed and stress-tested machines for work, creation or play."],
  ["03", "Repair & Service", "Fast, careful diagnostics and repairs for computers and laptops."],
  ["04", "Accessories", "Keyboards, monitors, storage and everything that completes your setup."],
];
const WHY = [
  "Honest advice — we recommend what you need, not what costs most",
  "Transparent pricing with GST shown clearly",
  "Skilled technicians and quality parts",
  "Quick turnaround and dependable after-sales support",
];
const STATS = [ // placeholder figures
  { to: 5000, suffix: "+", label: "Customers served" },
  { to: 1200, suffix: "+", label: "PCs built & sold" },
  { to: 8000, suffix: "+", label: "Repairs completed" },
  { to: 10, suffix: "+", label: "Years of experience" },
];
const FACES = [["f", "SALES"], ["b", "BUILD"], ["r", "REPAIR"], ["l", "GEAR"], ["t", "CARE"], ["d", "TECH"]];

export default function About() {
  return (
    <Section id="about">
      <Head eyebrow="About CloudCom" title="Technology, done properly" lead="" />
      <div className="about">
        <Reveal className="about__text">
          <p>
            CloudCom is your one-stop destination for computers — a showroom and workshop under one roof. We sell
            laptops and desktops, build custom PCs to order, repair computers and laptops, and stock the accessories
            that finish a setup.
          </p>
          <p>
            Whether you need a reliable machine for the office, a powerhouse for creative work, or a fast fix for the
            one you already own, our team treats every device as if it were our own.
          </p>
          <h3 className="sub">Why choose CloudCom</h3>
          <ul className="why">{WHY.map((w) => <li key={w}>{w}</li>)}</ul>
        </Reveal>

        <Reveal className="scene" i={2} {...tilt(14)}>
          <div className="stage3d">
            <i className="orbit orbit--1" /><i className="orbit orbit--2" />
            <div className="cube">
              {FACES.map(([k, t]) => <i key={k} className={`face face--${k}`} data-t={t} />)}
            </div>
          </div>
        </Reveal>
      </div>

      <ul className="grid grid--4">
        {PILLARS.map(([n, t, d], i) => (
          <Reveal as="li" i={i} key={n}>
            <article className="card pillar" {...tilt()}>
              <span className="pillar__n">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <i className="card__glare" />
            </article>
          </Reveal>
        ))}
      </ul>

      <ul className="stats">
        {STATS.map((s, i) => (
          <Reveal as="li" i={i} key={s.label} className="stat">
            <CountUp to={s.to} suffix={s.suffix} /><span>{s.label}</span>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
