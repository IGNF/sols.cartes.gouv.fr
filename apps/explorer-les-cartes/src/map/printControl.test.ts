import { describe, expect, it, vi } from 'vitest';
import { createPrintControl, PRINT_CONTROL_CLASS } from './printControl';

describe('createPrintControl', () => {
  it('crée un bouton nommé, dans un conteneur geopf, qui ouvre le dialogue', () => {
    const onOpen = vi.fn();
    const control = createPrintControl('Imprimer', onOpen);
    const element = (control as unknown as { element: HTMLElement }).element;
    expect(element).toHaveClass(PRINT_CONTROL_CLASS);
    // geopf's panel manager reads `<name>-<number>` on every widget of a position container.
    expect(element.id).toMatch(/^GPprint-\d+$/);
    expect(createPrintControl('Imprimer', onOpen)).not.toBe(control);
    const button = element.querySelector('button');
    expect(button).toHaveAttribute('aria-label', 'Imprimer');
    expect(button).toHaveAttribute('type', 'button');
    // The icon is a decorative span: the button's ::before is geopf's tooltip.
    expect(button).not.toHaveClass('fr-icon-printer-line');
    expect(button?.querySelector('span.fr-icon-printer-line')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(button).not.toHaveAttribute('title');
    button?.click();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
