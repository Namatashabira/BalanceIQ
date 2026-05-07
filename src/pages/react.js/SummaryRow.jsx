function computeResult(subjects) {
  if (!subjects || subjects.length === 0) return 'Result 3';

  const grades = subjects.map(s => s.grade?.toUpperCase());

  // Result 3: all grades are E
  const allE = grades.every(g => g === 'E');
  if (allE) return 'Result 3';

  // Result 2: any grade is E (failed at least one subject)
  const hasE = grades.some(g => g === 'E');
  if (hasE) return 'Result 2';

  // Result 1: passed all subjects (no grade below D)
  return 'Result 1';
}

export function SummaryRow({ summary, subjects }) {
  const result = computeResult(subjects);

  return (
    <section className="summary-row">
      <div>Average: <strong>{summary.average}</strong></div>
      <div>100% Average: <strong>{summary.total}</strong></div>
      <div>Result: <strong>{result}</strong></div>
      <div>
        Position: <strong>{summary.position}</strong> / {summary.outOf}
      </div>
    </section>
  );
}
