import { useState, useEffect } from 'react';

export const PRIMARY_CLASSES   = ['Baby', 'Middle', 'Top', 'P.1', 'P.2', 'P.3', 'P.4', 'P.5', 'P.6', 'P.7'];
export const SECONDARY_CLASSES = ['S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6'];

// Classes where an exam index number is relevant
export const PRIMARY_INDEX_CLASSES   = ['P.7'];
export const SECONDARY_INDEX_CLASSES = ['S.4', 'S.6'];

/** Read school_type from localStorage (schoolType key, or activeTenant.school_type). */
export function readSchoolType() {
  const direct = localStorage.getItem('schoolType');
  if (direct === 'primary' || direct === 'secondary') return direct;
  try {
    const t = JSON.parse(localStorage.getItem('activeTenant') || '{}');
    if (t.school_type === 'primary' || t.school_type === 'secondary') return t.school_type;
  } catch { /* ignore */ }
  return 'secondary'; // safe default
}

/** Persist school_type to both localStorage keys so every consumer stays in sync. */
export function writeSchoolType(type) {
  localStorage.setItem('schoolType', type);
  try {
    const t = JSON.parse(localStorage.getItem('activeTenant') || '{}');
    t.school_type = type;
    localStorage.setItem('activeTenant', JSON.stringify(t));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event('schoolTypeChanged'));
}

/**
 * Hook — returns { schoolType, classes, indexClasses } and re-renders
 * whenever schoolType changes (login, settings save, etc.).
 */
export default function useSchoolClasses() {
  const [schoolType, setSchoolType] = useState(readSchoolType);

  useEffect(() => {
    const sync = () => setSchoolType(readSchoolType());
    window.addEventListener('schoolTypeChanged', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('schoolTypeChanged', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isPrimary = schoolType === 'primary';
  return {
    schoolType,
    classes:      isPrimary ? PRIMARY_CLASSES   : SECONDARY_CLASSES,
    indexClasses: isPrimary ? PRIMARY_INDEX_CLASSES : SECONDARY_INDEX_CLASSES,
  };
}
