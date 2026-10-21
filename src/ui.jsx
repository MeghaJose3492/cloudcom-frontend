import { useEffect, useRef, useState } from "react";
import "./Sections.css";

export const Section = ({ id, alt, children }) => (
  <section id={id} className={`sec ${alt ? "sec--alt" : ""}`}>
    <i className="gl gl--1" /><i className="gl gl--2" /><i className="gl gl--3" /><i className="gl-ring" />
    <div className="sec__in">{children}</div>
  </section>
);

export const Head = ({ eyebrow, title, lead }) => (
  <Reveal className="head">
    <span className="eyebrow">{eyebrow}</span>
    <h2 className="title">{title}</h2>
    <p className="lead">{lead}</p>
  </Reveal>
);

// fades/rises into view once, with a stagger via the `i` prop
export function Reveal({ as: Tag = "div", i = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOn(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${on ? "in" : ""} ${className}`} style={{ "--i": i }} {...rest}>
      {children}
    </Tag>
  );
}

// 3D hover tilt + moving glare (spread onto the element: {...tilt()})
export const tilt = (max = 9) => ({
  onPointerMove(e) {
    if (e.pointerType === "touch") return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ty", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--tx", `${(0.5 - y) * max * 2}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  },
  onPointerLeave(e) {
    e.currentTarget.style.setProperty("--tx", "0deg");
    e.currentTarget.style.setProperty("--ty", "0deg");
  },
});

export function Img({ src, alt }) {
  const [bad, setBad] = useState(false);
  return src && !bad
    ? <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} />
    : <div className="ph" aria-hidden="true">{alt?.[0]}</div>;
}

export const Skeletons = () => (
  <ul className="grid">{[0, 1, 2, 3].map((k) => <li key={k} className="skel" />)}</ul>
);

export function CountUp({ to, suffix = "" }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / 1800, 1);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <b ref={ref}>{v.toLocaleString("en-IN")}{suffix}</b>;
}
