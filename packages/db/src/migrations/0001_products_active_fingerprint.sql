CREATE UNIQUE INDEX `products_active_fingerprint_uniq`
ON `products` (
  `business_id`,
  lower(trim(`name`)),
  coalesce(lower(trim(`description`)), ''),
  coalesce(lower(trim(`category`)), ''),
  coalesce(lower(trim(`sku`)), ''),
  printf('%.2f', cast(`price` AS real)),
  CASE
    WHEN `cost_price` IS NULL OR trim(`cost_price`) = '' THEN ''
    ELSE printf('%.2f', cast(`cost_price` AS real))
  END
)
WHERE `is_active` = 1;
