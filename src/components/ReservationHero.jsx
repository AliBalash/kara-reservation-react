export default function ReservationHero() {
  return (
    <section className="kp-hero">
      <video className="kp-hero__motion" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/media/kara-plus-motion.webm" type="video/webm" />
      </video>
      <div className="kp-hero__overlay" />
      <div className="kp-hero__content">
        <p className="kp-hero__kicker">KARA PLUS RENTAL DUBAI</p>
        <h1>Reserve Your Car in Dubai</h1>
        <p>Choose your dates, select your preferred vehicle and send your reservation request in just a few steps.</p>
        <ul className="kp-hero__trust" aria-label="Kara Plus benefits">
          <li>Best Price</li><li>Premium Service</li><li>24/7 Support</li>
        </ul>
      </div>
    </section>
  );
}
