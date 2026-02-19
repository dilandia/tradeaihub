/** Em dev usa localhost; em prod usa NEXT_PUBLIC_APP_URL ou app.tradeaihub.com */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://app.tradeaihub.com");
