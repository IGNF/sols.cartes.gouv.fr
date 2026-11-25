import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Matchers registered on this project's `expect` rather than through `@testing-library/jest-dom/vitest`,
// which imports `vitest` from its own location: with a stale bun store (after switching branches) it
// resolved a second Vitest copy ("failed to find the current suite"). Types still come from
// `@testing-library/jest-dom/vitest` (tsconfig.app.json).
expect.extend(matchers);

afterEach(() => {
  cleanup();
});
