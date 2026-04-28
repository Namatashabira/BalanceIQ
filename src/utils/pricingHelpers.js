// Utility helpers for pricing decisions based on global pricing settings
// This is UI-side only; server-side enforcement should mirror these rules.

export const defaultPricingSettings = {
  defaultCurrency: 'USD',
  country: 'UG',
  wholesaleThreshold: 10,
  pricePriority: 'retail-first',
  wholesaleAvailability: ['everyone'],
  enableTax: false,
  taxRate: 0,
  taxMode: 'included',
  priceMissing: 'default',
  rounding: 'nearest',
  orderLimitMin: 1,
  orderLimitMax: 99999,
};

export const getCurrencyCode = (settings) => {
  if (!settings) return defaultPricingSettings.defaultCurrency;
  return settings.defaultCurrency || settings.default_currency || defaultPricingSettings.defaultCurrency;
};

export const formatCurrency = (amount, settings) => {
  // Guard against NaN/undefined and unsupported currency codes
  const numeric = Number(amount);
  const value = Number.isFinite(numeric) ? numeric : 0;
  const currency = getCurrencyCode(settings);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    // Fallback if currency code is invalid/unsupported
    return `${currency || defaultPricingSettings.defaultCurrency} ${value.toLocaleString()}`;
  }
};

const roundValue = (value, mode) => {
  if (mode === 'up') return Math.ceil(value);
  if (mode === 'down') return Math.floor(value);
  return Math.round(value);
};

export function isWholesaleEligible(quantity, settings, userFlags = {}) {
  if (!settings) return quantity >= defaultPricingSettings.wholesaleThreshold;
  const threshold = settings.wholesaleThreshold ?? defaultPricingSettings.wholesaleThreshold;
  const availability = settings.wholesaleAvailability || defaultPricingSettings.wholesaleAvailability;

  // Eligibility by role list
  const allowEveryone = availability.includes('everyone');
  const allowWholesalers = availability.includes('wholesalers') && userFlags.isApprovedWholesaler;
  const allowAssigned = availability.includes('assigned') && userFlags.isAdminAssigned;

  const allowed = allowEveryone || allowWholesalers || allowAssigned;
  return allowed && quantity >= threshold;
}

export function selectUnitPrice(product, quantity, settings, requestedType = 'retail', userFlags = {}) {
  if (!product) return { unitPrice: 0, priceTypeUsed: requestedType, blocked: true, reason: 'No product' };
  const safeSettings = settings || defaultPricingSettings;
  const retailPrice = Number(product.retail_price ?? product.price ?? 0);
  const wholesalePrice = Number(product.wholesale_price ?? 0);

  const eligibleForWholesale = isWholesaleEligible(quantity, safeSettings, userFlags);
  const availabilityMap = {
    retail: retailPrice,
    wholesale: eligibleForWholesale ? wholesalePrice : 0,
  };

  const priceOrder = (() => {
    switch (safeSettings.pricePriority) {
      case 'wholesale-first':
        return ['wholesale', 'retail'];
      case 'country-first':
        // Country-aware pricing could be added here; fallback to retail/wholesale
        return ['retail', 'wholesale'];
      case 'retail-first':
      default:
        return ['retail', 'wholesale'];
    }
  })();

  // If user explicitly picked a type, try it first
  const orderedTypes = requestedType ? [requestedType, ...priceOrder] : priceOrder;

  if (requestedType === 'wholesale' && !eligibleForWholesale) {
    return { unitPrice: 0, priceTypeUsed: requestedType, blocked: true, reason: `Wholesale requires qty ≥ ${safeSettings.wholesaleThreshold}` };
  }

  let chosenType = null;
  let chosenPrice = 0;
  for (const t of orderedTypes) {
    const price = availabilityMap[t];
    if (price && price > 0) {
      chosenType = t;
      chosenPrice = price;
      break;
    }
  }

  if (!chosenPrice) {
    // Apply priceMissing policy
    const policy = safeSettings.priceMissing || 'default';
    if (policy === 'block') {
      return { unitPrice: 0, priceTypeUsed: requestedType, blocked: true, reason: 'Price missing (block)' };
    }
    if (policy === 'hide') {
      return { unitPrice: 0, priceTypeUsed: requestedType, blocked: true, reason: 'Price missing (hide)' };
    }
    // default: allow but use 0
    return { unitPrice: 0, priceTypeUsed: requestedType || priceOrder[0], blocked: false, reason: 'Price missing (default currency fallback)' };
  }

  // Apply rounding preference
  const roundedPrice = roundValue(chosenPrice, safeSettings.rounding || 'nearest');
  return { unitPrice: roundedPrice, priceTypeUsed: chosenType, blocked: false, reason: null };
}

export function computeTax(subTotal, settings) {
  const safeSettings = settings || defaultPricingSettings;
  const rate = Number(safeSettings.taxRate ?? safeSettings.tax_rate ?? 0);
  if (!safeSettings.enableTax || !Number.isFinite(rate) || rate <= 0) return { tax: 0, total: subTotal };

  const taxMode = safeSettings.taxMode || 'included';

  if (taxMode === 'included') {
    // Tax already in the price; extract it for display purposes
    const base = subTotal / (1 + rate / 100);
    const tax = subTotal - base;
    return { tax, total: subTotal };
  }

  // Checkout mode: tax added on top
  const tax = subTotal * (rate / 100);
  return { tax, total: subTotal + tax };
}
