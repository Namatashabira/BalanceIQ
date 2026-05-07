function computeResult(subjects) {
  if (!subjects || subjects.length === 0) return 'Result 3';
  const grades = subjects.map(s => s.grade?.toUpperCase());
  if (grades.every(g => g === 'E')) return 'Result 3';
  if (grades.some(g => g === 'E')) return 'Result 2';
  return 'Result 1';
}

export function SummaryRow({ summary, subjects }) {
  const result = computeResult(subjects);
  return (
    <section className="summary-row">
      <div>Average: <strong>{summary.average}</strong></div>
      <div>100% Average: <strong>{summary.total}</strong></div>
      <div>Result: <strong>{result}</strong></div>
      <div>Position: <strong>{summary.position}</strong> / {summary.outOf}</div>
    </section>
  );
}
