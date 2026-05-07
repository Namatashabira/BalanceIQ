const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
const API = `${BASE_URL}/fees/receipt-settings/`;

const LS_KEYS = {
  logo:          'schoolLogo',
  sigMode:       'bursarSigMode',
  sigImage:      'bursarSigImage',
  sigName:       'bursarSigName',
  sigLabel:      'bursarSigLabel',
  stampRaw:      'schoolStampRaw',
  stampOffsetX:  'schoolStampOffsetX',
  stampOffsetY:  'schoolStampOffsetY',
  stampRotate:   'schoolStampRotate',
  stampCircular: 'schoolStampCircular',
};

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  };
}

/** Map DB row → localStorage keys */
function dbToLocal(data) {
  if (data.logo       !== undefined) localStorage.setItem(LS_KEYS.logo,        data.logo);
  if (data.sig_mode   !== undefined) localStorage.setItem(LS_KEYS.sigMode,      data.sig_mode);
  if (data.sig_image  !== undefined) localStorage.setItem(LS_KEYS.sigImage,     data.sig_image);
  if (data.sig_name   !== undefined) localStorage.setItem(LS_KEYS.sigName,      data.sig_name);
  if (data.sig_label  !== undefined) localStorage.setItem(LS_KEYS.sigLabel,     data.sig_label);
  if (data.stamp_raw  !== undefined) localStorage.setItem(LS_KEYS.stampRaw,     data.stamp_raw);
  if (data.stamp_offset_x !== undefined) localStorage.setItem(LS_KEYS.stampOffsetX, String(data.stamp_offset_x));
  if (data.stamp_offset_y !== undefined) localStorage.setItem(LS_KEYS.stampOffsetY, String(data.stamp_offset_y));
  if (data.stamp_rotate   !== undefined) localStorage.setItem(LS_KEYS.stampRotate,  String(data.stamp_rotate));
  if (data.stamp_circular !== undefined) localStorage.setItem(LS_KEYS.stampCircular, String(data.stamp_circular));
}

/** Map localStorage → DB payload */
function localToDb() {
  return {
    logo:           localStorage.getItem(LS_KEYS.logo)         || '',
    sig_mode:       localStorage.getItem(LS_KEYS.sigMode)      || '',
    sig_image:      localStorage.getItem(LS_KEYS.sigImage)     || '',
    sig_name:       localStorage.getItem(LS_KEYS.sigName)      || '',
    sig_label:      localStorage.getItem(LS_KEYS.sigLabel)     || 'Bursar',
    stamp_raw:      localStorage.getItem(LS_KEYS.stampRaw)     || '',
    stamp_offset_x: Number(localStorage.getItem(LS_KEYS.stampOffsetX)  || 0),
    stamp_offset_y: Number(localStorage.getItem(LS_KEYS.stampOffsetY)  || 0),
    stamp_rotate:   Number(localStorage.getItem(LS_KEYS.stampRotate)   || 0),
    stamp_circular: localStorage.getItem(LS_KEYS.stampCircular) === 'true',
  };
}

/**
 * Load settings: tries DB first, falls back to localStorage if offline.
 * Always writes DB result back to localStorage so offline works next time.
 */
export async function loadReceiptSettings() {
  try {
    const res = await fetch(API, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      dbToLocal(data);   // keep localStorage in sync
      return data;
    }
  } catch { /* offline — fall through */ }

  // Offline fallback: read from localStorage
  return localToDb();
}

/**
 * Save settings: writes to localStorage immediately (works offline),
 * then tries to persist to DB in the background.
 */
export async function saveReceiptSettings(payload) {
  // 1. Always write to localStorage first — instant + offline safe
  dbToLocal({
    sig_mode:       payload.sig_mode,
    sig_image:      payload.sig_image,
    sig_name:       payload.sig_name,
    sig_label:      payload.sig_label,
    stamp_raw:      payload.stamp_raw,
    stamp_offset_x: payload.stamp_offset_x,
    stamp_offset_y: payload.stamp_offset_y,
    stamp_rotate:   payload.stamp_rotate,
    stamp_circular: payload.stamp_circular,
  });

  // 2. Try to persist to DB
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true, synced: true };
    return { ok: true, synced: false };
  } catch {
    // Offline — queue for later sync
    localStorage.setItem('receiptSettingsPendingSync', 'true');
    return { ok: true, synced: false };
  }
}

/**
 * Call on app startup / when connection is restored.
 * If there's a pending sync, push localStorage data to DB.
 */
export async function syncPendingReceiptSettings() {
  if (localStorage.getItem('receiptSettingsPendingSync') !== 'true') return;
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(localToDb()),
    });
    if (res.ok) localStorage.removeItem('receiptSettingsPendingSync');
  } catch { /* still offline */ }
}
