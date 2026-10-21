import { useEffect, useMemo, useRef, useState } from "react";
import heroBg from "./img/hero_background.jpg";
import "./CloudComHero.css";
import Products from "./Products";
import Services from "./Services";
import Contact from "./Contact";
import About from "./About";


const rand = (seed) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export default function Hero() {
  const root = useRef(null);
  const ring = useRef(null);
  const dot = useRef(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: rand(i + 1) * 100,
        top: rand(i + 50) * 100,
        size: 2 + rand(i + 9) * 3,
        dur: 14 + rand(i + 3) * 16,
        delay: -rand(i + 7) * 20,
        gold: i % 4 === 0,
      })),
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  // cursor + parallax
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cur = { ...pos };
    const rg = { ...pos };
    let raf;

    const move = (e) => {
      const r = el.getBoundingClientRect();
      pos.x = e.clientX - r.left;
      pos.y = e.clientY - r.top;
      dot.current.style.opacity = ring.current.style.opacity = 1;
      const over = e.target.closest("a,button");
      ring.current.classList.toggle("is-hover", !!over);
    };
    const leave = () => (dot.current.style.opacity = ring.current.style.opacity = 0);

    const tick = () => {
      cur.x += (pos.x - cur.x) * 0.2;
      cur.y += (pos.y - cur.y) * 0.2;
      rg.x += (pos.x - rg.x) * 0.09;
      rg.y += (pos.y - rg.y) * 0.09;
      const w = el.clientWidth, h = el.clientHeight;
      el.style.setProperty("--mx", `${rg.x}px`);
      el.style.setProperty("--my", `${rg.y}px`);
      el.style.setProperty("--rx", ((rg.x / w) * 2 - 1).toFixed(3));
      el.style.setProperty("--ry", ((rg.y / h) * 2 - 1).toFixed(3));
      dot.current.style.transform = `translate(${cur.x}px,${cur.y}px)`;
      ring.current.style.transform = `translate(${rg.x}px,${rg.y}px)`;
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <section ref={root} id="home" className={`hero ${ready ? "is-ready" : ""}`}>
      <div className="hero__bg" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="hero__clear" />
      <div className="hero__frost hero__frost--a" />
      <div className="hero__grain" />
      <div className="hero__seam" />
      <div className="hero__spot" />

      <header className="hero__nav-wrap">
        <a className="hero__brand" href="#home" onClick={() => setMenuOpen(false)} aria-label="CloudCom home">
          <span className="hero__brand-mark" aria-hidden="true">C</span>
          <span>CloudCom</span>
        </a>
        <nav className="hero__nav" aria-label="Main navigation">
          <button
            className={`hero__menu-toggle${menuOpen ? " is-open" : ""}`}
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="hero-navigation-links"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
          <div id="hero-navigation-links" className={`hero__nav-links${menuOpen ? " is-open" : ""}`}>
            {[
              ["Home", "#home"],
              ["Products", "#products"],
              ["Services", "#services"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </div>
        </nav>
      </header>

      {/* floating glass panes + hairlines (parallax depth) */}
      <div className="hero__stage" aria-hidden="true">
        <i className="pane pane--1" />
        <i className="pane pane--2" />
        <i className="pane pane--3" />
        <i className="pane pane--4" />
        <i className="pane pane--5" />
        <i className="line line--1" />
        <i className="line line--2" />
        <i className="line line--3" />
        <i className="ring-o ring-o--1" />
        <i className="ring-o ring-o--2" />
      </div>

      <div className="hero__particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            className={p.gold ? "gold" : ""}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="hero__content">
        <h1 className="mark" aria-label="CloudCom">
          <span className="mark__half mark__half--glass" aria-hidden="true">CloudCom</span>
          <span className="mark__half mark__half--solid" aria-hidden="true">CloudCom</span>
        </h1>

        <h2 className="hero__title">
          Your One-Stop Destination for Custom PCs, Tech Sales &amp;{" "}
          <em>Fast Repairs.</em>
        </h2>
        <p className="hero__sub">
          Quality hardware, custom-built PCs, accessories and dependable
          computer services — all in one place.
        </p>

        <div className="hero__cta">
          <a href="#products" className="btn btn--primary">
            Explore Laptops &amp; PCs
          </a>
          <a href="#services" className="btn btn--ghost">
            View Services
          </a>
        </div>
      </div>

      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </section>
      <Products />
      <Services />
      <About />
      <Contact />
    </>
  );
}