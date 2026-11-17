import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterAll, beforeAll, describe, expect, setSystemTime, test } from 'bun:test';
import { join } from 'node:path';

const CAROUSEL_JS = join(import.meta.dir, '..', 'src', 'js', 'carousel.js');

const item = (datetime) =>
  `<li class="sols-carousel__item"><time datetime="${datetime}">${datetime}</time></li>`;

/** Two carousels as the home page renders them: one with a past and a future event, one all past. */
const MARKUP = `
<section id="mixte">
  <div class="sols-carousel" data-sols-carousel>
    <div class="sols-carousel__controls" hidden>
      <button data-sols-carousel-previous></button><button data-sols-carousel-next></button>
    </div>
    <section data-sols-carousel-viewport><ul>
      ${item('2026-11-26T14:00')}${item('2026-12-01T09:00')}${item('2026-12-08T10:00')}
    </ul></section>
  </div>
  <p hidden data-sols-carousel-empty>Aucun événement</p>
</section>
<section id="passe">
  <div class="sols-carousel" data-sols-carousel>
    <div class="sols-carousel__controls" hidden>
      <button data-sols-carousel-previous></button><button data-sols-carousel-next></button>
    </div>
    <section data-sols-carousel-viewport><ul>${item('2026-11-03T14:00')}</ul></section>
  </div>
  <p hidden data-sols-carousel-empty>Aucun événement</p>
</section>`;

beforeAll(async () => {
  GlobalRegistrator.register();
  setSystemTime(new Date(2026, 11, 1, 18, 0));
  document.body.innerHTML = MARKUP;
  await import(CAROUSEL_JS);
});
afterAll(() => {
  setSystemTime();
  GlobalRegistrator.unregister();
});

describe('agenda: events past since the build', () => {
  test('past days are removed, the current day and later stay', () => {
    const left = [...document.querySelectorAll('#mixte time')].map((t) => t.dateTime);
    expect(left).toEqual(['2026-12-01T09:00', '2026-12-08T10:00']);
    expect(document.querySelector('#mixte [data-sols-carousel]').hidden).toBe(false);
    expect(document.querySelector('#mixte [data-sols-carousel-empty]').hidden).toBe(true);
  });

  test('no event left: the carousel is hidden and the empty message shown', () => {
    expect(document.querySelector('#passe [data-sols-carousel]').hidden).toBe(true);
    expect(document.querySelector('#passe [data-sols-carousel-empty]').hidden).toBe(false);
  });
});
