export default function SuccessState({ result, onReset, formatMoney }) {
  const requiresReview = result.requires_review || result.status === "review_pending";

  return (
    <section className="kp-success" aria-live="polite">
      <h2>Reservation Request Received</h2>
      <p>
        {requiresReview
          ? "Your request is with our reservation team for review. We will confirm the vehicle, dates and final details with you shortly."
          : "Your request has been sent to Kara Plus. Our team will contact you shortly to confirm the next steps."}
      </p>
      <div className="kp-success__meta">
        <article><span>Contract / Request ID</span><strong>#{result.contract_id}</strong></article>
        <article><span>Status</span><strong>{requiresReview ? "Awaiting expert review" : result.status}</strong></article>
        <article><span>Estimated Final Total</span><strong>{formatMoney(result.quote?.final_total)} AED</strong></article>
      </div>
      <button type="button" className="kp-btn kp-btn--primary" onClick={onReset}>Book Another Car</button>
    </section>
  );
}
