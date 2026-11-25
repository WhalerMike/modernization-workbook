import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// A busy machine (a CI runner, or a laptop also running the Java tests) can take more than the
// default second to render; wait up to five before a findBy or waitFor gives up.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => cleanup());
