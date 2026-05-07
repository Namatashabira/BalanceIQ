export function PerformanceTable({ subjects, assessmentModel }) {
  return (
    <section>
      <h3>PERFORMANCE RECORDS</h3>

      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Subject</th>

            {assessmentModel === "A1" && (
              <>
                <th>A1</th><th>A2</th><th>A3</th><th>AVG</th>
                <th>20%</th><th>80%</th><th>100%</th>
              </>
            )}

            {assessmentModel === "U1" && (
              <>
                <th>U1</th><th>U2</th><th>U3</th><th>U4</th>
                <th>AVE</th>
              </>
            )}

            <th>Grade</th>
            <th>Level of Achievement</th>
            <th>TR</th>
          </tr>
        </thead>

        <tbody>
          {subjects.map((s, i) => (
            <tr key={i}>
              <td>{s.code}</td>
              <td>{s.name}</td>

              {s.scores.map((v, idx) => (
                <td key={idx}>{v}</td>
              ))}

              <td>{s.grade}</td>
              <td>{s.achievement}</td>
              <td>{s.teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}