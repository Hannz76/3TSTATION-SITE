import { useEffect } from "react";

const revealTargets = [
  ".section-heading", ".service-item", ".game-card", ".repair-visual", ".repair-copy",
  ".flavor-card", ".company-introduction", ".founders-heading", ".founder-card",
  ".review-section-heading", ".review-showcase", ".review-invitation", ".review-form-card",
  ".published-reviews", ".faq-section > div", ".contact-banner", ".topup-title",
  ".topup-hero-primary", ".repair-step", ".repair-page-heading", ".repair-pricing-card",
  ".repair-process-grid > div", ".repair-request", ".topup-order-card", ".topup-order-aside",
].join(", ");

/** Animate content when it becomes visible, rather than while it is offscreen. */
export function usePageMotion() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealTargets));
    const clear = () => {
      observer?.disconnect();
      for (const element of elements) {
        element.classList.remove("motion-reveal", "is-revealed");
        element.style.removeProperty("--reveal-delay");
      }
    };
    const reveal = (element: HTMLElement) => {
      element.classList.add("is-revealed");
      observer?.unobserve(element);
    };
    const start = () => {
      clear();
      if (preference.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }, { threshold: 0.08 });
      for (const element of elements) {
        // Stagger neighbouring cards without delaying an entire page of items.
        const siblings = Array.from(element.parentElement?.children || []).filter(sibling => sibling.matches(revealTargets));
        element.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(element), 3) * 80}ms`);
        element.classList.add("motion-reveal");
        observer.observe(element);
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>(".motion-reveal");
      if (element) reveal(element);
    };
    start();
    preference.addEventListener("change", start);
    document.addEventListener("focusin", onFocus);
    return () => {
      clear();
      preference.removeEventListener("change", start);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
}
