import { useState } from "react";
import { useItems, money, PRODUCTS_DEMO } from "./Api";
import { Section, Head, Reveal, Img, Skeletons, tilt } from "./ui";

const status = (s) =>
  s == null ? { t: "Available", c: "ok" }
  : s <= 0 ? { t: "Out of stock", c: "out" }
  : s <= 5 ? { t: `Only ${s} left`, c: "low" }
  : { t: "In stock", c: "ok" };

export default function Products() {
  const { loading, items, demo } = useItems("PRODUCT", PRODUCTS_DEMO);
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(items.map((p) => p.category).filter(Boolean))];
  const shown = cat === "All" ? items : items.filter((p) => p.category === cat);

  return (
    <Section id="products" alt>
      <span id="shop" />
      <Head
        eyebrow="Hardware showroom"
        title="Our Products"
        lead="Laptops, desktops, components and accessories — quality hardware, ready to go home with you."
      />
      <div className="bar" role="tablist" aria-label="Product categories">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? "is-on" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {loading ? <Skeletons /> : shown.length === 0 ? (
        <p className="empty">No products in this category yet.</p>
      ) : (
        <ul className="grid" key={cat}>
          {shown.map((p, i) => {
            const st = status(p.stock);
            return (
              <Reveal as="li" i={i} key={p.id}>
                <article className={`card ${st.c === "out" ? "is-out" : ""}`} {...tilt()}>
                  <div className="card__media">
                    <Img src={p.image} alt={p.name} />
                    {p.category && <span className="pill pill--cat">{p.category}</span>}
                    <span className={`pill pill--${st.c}`}>{st.t}</span>
                  </div>
                  <div className="card__body">
                    <h3>{p.name}</h3>
                    <p>{p.desc}</p>
                    <div className="price"><b>{money(p.price)}</b></div>
                  </div>
                  <i className="card__glare" />
                </article>
              </Reveal>
            );
          })}
        </ul>
      )}
      {demo && process.env.NODE_ENV !== "production" && <p className="demo">Showing sample data — API not reachable.</p>}
    </Section>
  );
}
