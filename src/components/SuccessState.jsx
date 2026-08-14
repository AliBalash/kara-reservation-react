export default function SuccessState({ result, onReset, formatMoney }) {
  return (
    <section className="kp-success" aria-live="polite">
      <h2>Reservation Request Received</h2>
      <p>Your request has been sent to Kara Plus. Our team will contact you shortly to confirm the next steps.</p>
      <div className="kp-success__meta">
        <article><span>Contract / Request ID</span><strong>#{result.contract_id}</strong></article>
        <article><span>Status</span><strong>{result.status}</strong></article>
        <article><span>Estimated Final Total</span><strong>{formatMoney(result.quote?.final_total)} AED</strong></article>
      </div>
      <button type="button" className="kp-btn kp-btn--primary" onClick={onReset}>Book Another Car</button>
    </section>
  );
}
