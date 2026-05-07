export function OverallPerformance({ overall }) {
  return (
    <section className="overall-performance">
      <div>Overall Identifier: <strong>{overall.identifier}</strong></div>
      <div>Overall Achievement: <strong>{overall.achievement}</strong></div>
      <div>Overall Grade: <strong>{overall.grade}</strong></div>
    </section>
  );
}