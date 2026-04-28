// Maps business type values to feature suggestions
// Extend this as needed for your business types
const BUSINESS_TYPE_FEATURES = {
  retail: [
    'Inventory management',
    'Point of Sale (POS)',
    'Sales analytics',
    'Customer loyalty program',
    'Barcode scanning',
  ],
  restaurant: [
    'Menu management',
    'Table reservations',
    'Order tracking',
    'Kitchen display system',
    'Waiter mobile app',
  ],
  pharmacy: [
    'Prescription tracking',
    'Expiry alerts',
    'Insurance claims',
    'Inventory batch management',
    'Regulatory compliance',
  ],
  salon: [
    'Appointment scheduling',
    'Service menu',
    'Staff management',
    'Loyalty rewards',
    'SMS reminders',
  ],
  // Add more mappings as needed
};

export function getFeaturesForBusinessType(typeValue) {
  if (!typeValue) return [];
  // Try direct match
  if (BUSINESS_TYPE_FEATURES[typeValue]) return BUSINESS_TYPE_FEATURES[typeValue];
  // Try fuzzy match by key
  const key = Object.keys(BUSINESS_TYPE_FEATURES).find(k => typeValue.toLowerCase().includes(k));
  return key ? BUSINESS_TYPE_FEATURES[key] : [];
}
