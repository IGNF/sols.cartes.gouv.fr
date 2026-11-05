import { describe, expect, it } from 'vitest';
import { createQueryClient } from './queryClient';

describe('createQueryClient', () => {
  it('garde les capacités GPF pour la session et réessaie une fois', () => {
    const options = createQueryClient().getDefaultOptions().queries;
    expect(options).toMatchObject({ staleTime: Infinity, refetchOnWindowFocus: false, retry: 1 });
  });
});
