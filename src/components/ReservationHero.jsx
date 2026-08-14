export default function ReservationHero() {
  return (
    <section className="kp-hero">
      <div className="kp-hero__overlay" />
      <div className="kp-hero__content">
        <h1>
          <span>Looking to Rent a Car in Dubai?</span>
          <span>You&apos;re in the perfect spot.</span>
        </h1>
        <ul className="kp-hero__trust" aria-label="Kara Plus benefits">
          <li>Best Price</li><li>Premium Services</li><li>24/7 Support</li>
        </ul>
        <a className="kp-hero__reservation-link" href="#request-form">Start your reservation</a>
      </div>
    </section>
  );
}
