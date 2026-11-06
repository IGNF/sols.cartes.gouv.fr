import { describe, expect, it } from 'vitest';
import { escapeHtml, unescapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('neutralise le balisage et les guillemets', () => {
    expect(escapeHtml('Teneurs < 2 % & "argile" <script>x</script>')).toBe(
      'Teneurs &lt; 2 % &amp; &quot;argile&quot; &lt;script&gt;x&lt;/script&gt;',
    );
    expect(escapeHtml("l'humus")).toBe('l&#39;humus');
    expect(escapeHtml('INRAE - Info&Sols')).toBe('INRAE - Info&amp;Sols');
  });

  it('se renverse exactement (unescapeHtml), y compris pour un « &amp; » littéral', () => {
    for (const text of [
      'INRAE - Info&Sols',
      'l\'humus < 2 % & "argile"',
      'un &amp; litteral',
      '',
    ]) {
      expect(unescapeHtml(escapeHtml(text))).toBe(text);
    }
    expect(unescapeHtml('INRAE - Info&amp;Sols')).toBe('INRAE - Info&Sols');
  });
});
