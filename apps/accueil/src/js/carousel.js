/**
 * Agenda carousel: previous / next buttons scroll the list by one viewport.
 * Progressive enhancement: without JS the buttons stay hidden and the list scrolls natively
 * (scroll-snap, focusable region for the keyboard).
 */
for (const carousel of document.querySelectorAll('[data-sols-carousel]')) {
  const viewport = carousel.querySelector('[data-sols-carousel-viewport]');
  const previous = carousel.querySelector('[data-sols-carousel-previous]');
  const next = carousel.querySelector('[data-sols-carousel-next]');
  const controls = previous.parentElement;

  const update = () => {
    const max = viewport.scrollWidth - viewport.clientWidth - 1;
    previous.disabled = viewport.scrollLeft <= 0;
    next.disabled = viewport.scrollLeft >= max;
    controls.hidden = viewport.scrollWidth <= viewport.clientWidth;
  };
  const scroll = (direction) =>
    viewport.scrollBy({ left: direction * viewport.clientWidth * 0.8, behavior: 'smooth' });

  previous.addEventListener('click', () => scroll(-1));
  next.addEventListener('click', () => scroll(1));
  viewport.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
