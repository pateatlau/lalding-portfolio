import * as Sentry from '@sentry/nextjs';

// Sentry token
// lalding-token
// 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

export async function register() {
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }
  await import('./sentry.server.config');
}

export const onRequestError = Sentry.captureRequestError;
