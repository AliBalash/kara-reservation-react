export default function KaraFooter() {
  return (
    <footer className="kara-footer">
      <div className="kara-footer__inner">
        <div><img src="/kara-plus-logo.webp" alt="Kara Plus Rent a Car" width="150" height="72" /><p>Premium car rental in Dubai with transparent pricing and personal support.</p></div>
        <div><h2>Need help?</h2><a href="tel:+971506990654">+971 50 699 0654</a><a href="mailto:info@karaplus.ae">info@karaplus.ae</a></div>
        <div><h2>Visit Kara Plus</h2><a href="https://newsite.karaplus.ae/about-us/">About Us</a><a href="https://newsite.karaplus.ae/contact/">Contact</a><a href="https://newsite.karaplus.ae/terms-conditions/">Terms & Conditions</a></div>
      </div>
      <p className="kara-footer__copyright">© {new Date().getFullYear()} Kara Plus. All rights reserved.</p>
    </footer>
  );
}
