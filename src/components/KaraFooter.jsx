export default function KaraFooter() {
  return (
    <footer className="kara-footer">
      <div className="kara-footer__inner">
        <section className="kara-footer__contact" aria-label="Kara Plus contact details">
          <img src="/kara-plus-logo.png" alt="Kara Plus Rent a Car" width="1536" height="1024" />
          <p>Office 601, Block B, Business Village Building, Clock Tower, Deira, Dubai</p>
          <p>Hours: 7:00 – 23:00, Mon – Sat</p>
          <a href="mailto:info@karaplus.ae">info@karaplus.ae</a>
          <h2>Need help? Call us</h2>
          <a className="kara-footer__phone" href="tel:+971506990654">(+971) 50 699 0654</a>
        </section>
        <nav className="kara-footer__links" aria-label="Footer navigation">
          <a href="https://newsite.karaplus.ae/about-us/">About Us</a>
          <a href="https://newsite.karaplus.ae/faqs/">FAQs</a>
          <a href="https://newsite.karaplus.ae/terms-conditions/">Terms &amp; Conditions</a>
          <a href="https://newsite.karaplus.ae/contact/">Contact</a>
        </nav>
        <div className="kara-footer__map">
          <iframe
            title="Kara Plus Rent a Car location"
            src="https://maps.google.com/maps?q=karaplus%20rent%20a%20car&t=m&z=15&output=embed&iwloc=near"
            loading="lazy"
          />
        </div>
      </div>
      <p className="kara-footer__copyright">© 2025 <span>Kara Plus</span> Inc. All rights reserved.</p>
    </footer>
  );
}
