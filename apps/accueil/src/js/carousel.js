/**
 * Agenda carousel: previous / next buttons scroll the list by one viewport.
 * Progressive enhancement: without JS the buttons stay hidden and the list scrolls natively
 * (scroll-snap, focusable region for the keyboard).
 * The site is static: events whose day passed since the build are removed here (the build keeps the
 * events of its own day and later, eleventy.config.js `upcoming`).
 */
// Local day as YYYY-MM-DD (the Swedish locale formats dates in ISO order).
const today = new Date().toLocaleDateString('sv-SE');

for (const carousel of document.querySelectorAll('[data-sols-carousel]')) {
  for (const time of carousel.querySelectorAll('.sols-carousel__item time[datetime]')) {
    if (time.getAttribute('datetime').slice(0, 10) < today) {
      time.closest('.sols-carousel__item').remove();
    }
  }
  if (!carousel.querySelector('.sols-carousel__item')) {
    carousel.hidden = true;
    const empty = carousel.parentElement.querySelector('[data-sols-carousel-empty]');
    if (empty) empty.hidden = false;
    continue;
  }
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
