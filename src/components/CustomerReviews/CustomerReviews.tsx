import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { reviewScreenshots } from "./reviews";
import "./CustomerReviews.css";

const CircularCarousel = lazy(() => import("../CircularCarousel/CircularCarousel.jsx"));
const ratingLabels = ["Poor", "Fair", "Good", "Very good", "Excellent"];

function ScreenshotViewer({ index, close }: { index: number; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item = reviewScreenshots[index];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const element = dialog.current;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return <dialog ref={dialog} className="review-viewer" aria-labelledby="review-viewer-title" onCancel={close}>
    <header><h3 id="review-viewer-title">{item.title}</h3><button type="button" autoFocus onClick={close} aria-label="Close screenshot">×</button></header>
    <img src={item.src} alt={item.alt} />
    <p>{item.subtitle}</p>
  </dialog>;
}

type Review = { id: number; name: string; service: string; rating: number; message: string; created_at: string };
type ReviewPage = { reviews: Review[]; total: number; average: number; nextCursor: number | null };

async function reviewRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Reviews are temporarily unavailable. Please try again shortly.");
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function ReviewForm({ onPublished }: { onPublished: () => void }) {
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const submission = useRef<string | null>(null);
  const submitting = useRef(false);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("review-name") || "").trim();
    const message = String(data.get("review-message") || "").trim();
    if (!name || message.length < 10) {
      setSuccess(false);
      setStatus("Please enter your name and a review of at least 10 characters.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setSuccess(false);
    setStatus("");
    submission.current ||= crypto.randomUUID();
    try {
      await reviewRequest("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission.current, name, message, rating, service: data.get("review-service"), consent: data.get("review-consent") === "on", website: data.get("website") }),
      });
      form.reset();
      setRating(0);
      submission.current = null;
      setSuccess(true);
      setStatus("Thank you! Your review is now published below.");
      onPublished();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "We couldn’t publish your review. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return <div className="review-form-card" id="write-review">
    <div className="review-form-heading"><span className="eyebrow">YOUR EXPERIENCE MATTERS</span><h3>How was your pit stop?</h3><p>A little feedback goes a long way.</p></div>
    <form className="review-form" onSubmit={publish} aria-busy={busy}>
      <fieldset className="review-rating" disabled={busy}><legend>Your rating <span>(required)</span></legend>
        <div className="review-stars">{ratingLabels.map((label, index) => <label key={label} className={rating >= index + 1 ? "is-selected" : ""}>
          <input type="radio" name="review-rating" value={index + 1} required checked={rating === index + 1} onChange={() => setRating(index + 1)} aria-label={`${index + 1} ${index === 0 ? "star" : "stars"} — ${label}`} />
          <span aria-hidden="true">★</span>
        </label>)}</div><span className="review-rating-label" aria-live="polite">{rating ? ratingLabels[rating - 1] : "Choose your stars"}</span>
      </fieldset>
      <div className="review-field-row"><label>Display name<input name="review-name" autoComplete="name" required maxLength={60} placeholder="Your name or nickname" disabled={busy} /></label>
        <label>Your service<select aria-label="Your service" name="review-service" required defaultValue="" disabled={busy}><option value="" disabled>Choose a service</option><option>Game top-up</option><option>Phone repair</option><option>Fresh yogurt</option><option>Store visit</option></select></label></div>
      <label>Your review<textarea name="review-message" rows={4} required minLength={10} maxLength={1500} placeholder="Tell us what went well, or what we could do better…" disabled={busy} /></label>
      <div className="review-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="review-consent"><input name="review-consent" type="checkbox" required disabled={busy} /><span>I agree to display my name, rating, and review publicly on this website.</span></label>
      <div className="review-submit-row"><p>Please keep personal contact and account details out of your review.</p><button type="submit" disabled={busy} className="button button-dark">{busy ? "Publishing…" : "Publish my review"} <span aria-hidden="true">↗</span></button></div>
    </form>
    <p className={`review-status ${success ? "is-success" : ""}`} role="status">{status}</p>
  </div>;
}

function PublishedReviews({ version }: { version: number }) {
  const [page, setPage] = useState<ReviewPage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    setBusy(true);
    reviewRequest("/api/reviews").then((result: ReviewPage) => { if (!cancelled) setPage(result); })
      .catch(() => { if (!cancelled) setError("We couldn’t load the reviews. Please try again."); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [version, retry]);
  const more = async () => {
    if (!page?.nextCursor || busy) return;
    setBusy(true);
    setError("");
    try {
      const next: ReviewPage = await reviewRequest(`/api/reviews?before=${page.nextCursor}`);
      setPage(current => current ? { ...next, reviews: [...current.reviews, ...next.reviews] } : next);
    } catch { setError("We couldn’t load more reviews. Please try again."); }
    finally { setBusy(false); }
  };
  return <div className="published-reviews" aria-labelledby="published-reviews-title">
    <div className="published-reviews-heading"><div><span className="eyebrow">FROM OUR COMMUNITY</span><h3 id="published-reviews-title">Fresh from our customers.</h3></div>{page && page.total > 0 && <span className="review-summary"><span aria-hidden="true">★</span> {page.average.toFixed(1)} / 5 <small>· {page.total} review{page.total === 1 ? "" : "s"}</small></span>}</div>
    {error && <p className="review-feed-message" role="status">{error} <button className="text-link" onClick={() => setRetry(n => n + 1)}>Try again</button></p>}
    {busy && !page && <p className="review-feed-message" role="status">Loading customer reviews…</p>}
    {page?.total === 0 && <div className="review-empty"><span aria-hidden="true">✳</span><h4>Every story starts somewhere.</h4><p>Be the first to leave a written review.</p></div>}
    <div className="published-review-grid">{page?.reviews.map(review => <article className="published-review" key={review.id}><header><span className="review-avatar" aria-hidden="true">{review.name.slice(0, 1).toUpperCase()}</span><div><h4>{review.name}</h4><span>{review.service}</span></div><span className="published-review-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></span></header><p>{review.message}</p><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</time></article>)}</div>
    {page?.nextCursor && <button className="button button-outline review-load-more" disabled={busy} onClick={more}>{busy ? "Loading…" : "More reviews"}</button>}
  </div>;
}

export default function CustomerReviews() {
  const [version, setVersion] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const move = (direction: "ArrowLeft" | "ArrowRight") => {
    const element = carousel.current?.querySelector<HTMLElement>("[aria-roledescription='carousel']");
    element?.focus({ preventScroll: true });
    element?.dispatchEvent(new KeyboardEvent("keydown", { key: direction, bubbles: true }));
  };
  return <section className="customer-reviews" id="reviews" aria-labelledby="customer-reviews-title">
    <div className="container">
      <div className="review-section-heading"><div><span className="eyebrow">THE PEOPLE WHO MAKE OUR STATION</span><h2 id="customer-reviews-title">Customer Review<span>.</span></h2></div><a className="text-link" href="#write-review">Leave a little feedback <span aria-hidden="true">↗</span></a></div>
      <div className="review-showcase">
        <div className="review-showcase-note"><span className="review-note-mark" aria-hidden="true">“</span><div><h3>Little moments. Lasting impressions.</h3><p>Stories from our customers. Select a screenshot to take a closer look.</p></div><span className="review-showcase-tag">PLAY. REPAIR. REFRESH.</span></div>
        <div ref={carousel} className="review-carousel-shell"><Suspense fallback={<div className="review-carousel-loading">Loading the review gallery…</div>}>
          <CircularCarousel items={reviewScreenshots} preset="orbit" intro="rise" tilt={-8} cardWidth={235} aspectRatio={561 / 1280} gap={70} speed={10} autoplay={paused || selected !== null ? "off" : "drift"} captions fadeColor="var(--review-surface)" depthFade={0.35} innerShade={0.85} cornerRadius={18} parallax={0.15} onItemClick={(_, index) => setSelected(index)} />
        </Suspense></div>
        <div className="review-gallery-controls"><span>Drag to explore · select to read</span><div><button type="button" onClick={() => move("ArrowLeft")} aria-label="Previous review screenshot">←</button><button type="button" onClick={() => setPaused(current => !current)} aria-label={paused ? "Play review carousel" : "Pause review carousel"}>{paused ? "Play" : "Pause"}</button><button type="button" onClick={() => move("ArrowRight")} aria-label="Next review screenshot">→</button></div></div>
      </div>
      <div className="review-writing-layout"><div className="review-invitation"><span className="eyebrow">YOUR TURN</span><h3>Good words.<br />Honest thoughts.<br /><span>All welcome.</span></h3><p>Powered up your game? Given your phone a fresh start? Found your favourite flavour? Tell us how it went.</p><div className="review-invitation-note"><span aria-hidden="true">✳</span> Every experience helps us make the next one better.</div></div><ReviewForm onPublished={() => setVersion(n => n + 1)} /></div>
      <PublishedReviews key={version} version={version} />
    </div>
    {selected !== null && <ScreenshotViewer index={selected} close={() => setSelected(null)} />}
  </section>;
}
