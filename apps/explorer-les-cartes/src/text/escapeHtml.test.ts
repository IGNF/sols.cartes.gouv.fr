import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('neutralise le balisage et les guillemets', () => {
    expect(escapeHtml('Teneurs < 2 % & "argile" <script>x</script>')).toBe(
      'Teneurs &lt; 2 % &amp; &quot;argile&quot; &lt;script&gt;x&lt;/script&gt;',
    );
    expect(escapeHtml("l'humus")).toBe('l&#39;humus');
    expect(escapeHtml('INRAE - Info&Sols')).toBe('INRAE - Info&amp;Sols');
  });
});
