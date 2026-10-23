/**
 * Helper to determine if Dev Mock tools should be rendered.
 * Strictly true only during local Vite development with VITE_USE_MOCKS='true'.
 */
export const isDevMock = Boolean(
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true'
);
