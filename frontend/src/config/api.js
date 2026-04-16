const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

export const API_BASE_URL = trimTrailingSlash(
  process.env.REACT_APP_API_BASE_URL || 'https://e-comarces.onrender.com'
);

export const API_ORIGIN = trimTrailingSlash(
  process.env.REACT_APP_API_ORIGIN || API_BASE_URL
);
