-- Normalize pairs with slash separator (XAU/USD → XAUUSD, BTC/USD → BTCUSD)
UPDATE public.trades
SET pair = REPLACE(pair, '/', '')
WHERE pair LIKE '%/%'
  AND deleted_at IS NULL;
