const links = [
  { label: "Home", href: "https://newsite.karaplus.ae/" },
  { label: "All Cars", href: "https://newsite.karaplus.ae/cars/" },
  { label: "Blog", href: "https://newsite.karaplus.ae/blog/" },
  { label: "About Us", href: "https://newsite.karaplus.ae/about-us/" },
  { label: "Contact", href: "https://newsite.karaplus.ae/contact/" },
];

export default function KaraHeader({ open, onToggle, onClose }) {
  return (
    <header className="kara-header">
      <div className="kara-header__inner">
        <a className="kara-header__brand" href="https://newsite.karaplus.ae/" aria-label="Kara Plus home">
          <img src="/kara-plus-logo.png" alt="Kara Plus Rent a Car" width="1536" height="1024" />
        </a>
        <button className="kara-menu-button" type="button" onClick={onToggle} aria-expanded={open} aria-controls="kara-navigation" aria-label="Toggle navigation">
          <span /><span /><span />
        </button>
        <nav id="kara-navigation" className={`kara-navigation ${open ? "is-open" : ""}`} aria-label="Primary navigation">
          {links.map((link) => <a key={link.label} href={link.href} onClick={onClose}>{link.label}</a>)}
        </nav>
      </div>
    </header>
  );
}
