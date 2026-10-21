import { useEffect, useRef, useState } from 'react';
import './Navbar.css';

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Products', href: '#products' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

function Navbar({ initialActive = 'products' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(() => window.location.hash.slice(1) || initialActive);
  const navbarRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnOutsideClick(event) {
      if (!navbarRef.current?.contains(event.target)) setIsOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  function selectLink(label) {
    setActiveLink(label.toLowerCase());
    setIsOpen(false);
  }

  return (
    <nav className="site-navigation" aria-label="Main navigation" ref={navbarRef}>
      <button
        className={`mobile-menu-toggle${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="site-navigation-links"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div id="site-navigation-links" className={`site-navigation-links${isOpen ? ' is-open' : ''}`}>
        {links.map(({ label, href }) => {
          const isActive = activeLink === label.toLowerCase();
          return (
            <a
              key={label}
              className={`site-navigation-link${isActive ? ' is-active' : ''}`}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => selectLink(label)}
            >
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default Navbar;