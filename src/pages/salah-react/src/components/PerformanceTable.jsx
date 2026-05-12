export function PerformanceTable({ subjects, assessmentModel }) {
  // Get the maximum number of rows needed (subjects + empty lines)
  const totalRows = Math.max(subjects.length, 20); // Show at least 20 rows
  const emptyRows = totalRows - subjects.length;

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
                <th>A1</th>
                <th>A2</th>
                <th>A3</th>
                <th>AVG</th>
                <th>20%</th>
                <th>80%</th>
                <th>100%</th>
              </>
            )}
            {assessmentModel === "U1" && (
              <>
                <th>U1</th>
                <th>U2</th>
                <th>U3</th>
                <th>U4</th>
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
              {assessmentModel === "A1" && (
                <>
                  <td>{s.scores[0] || '—'}</td>
                  <td>{s.scores[1] || '—'}</td>
                  <td>{s.scores[2] || '—'}</td>
                  <td>{s.scores[3] || '—'}</td>
                  <td>{s.scores[4] || '—'}</td>
                  <td>{s.scores[5] || '—'}</td>
                  <td>{s.scores[6] || '—'}</td>
                </>
              )}
              {assessmentModel === "U1" && (
                <>
                  <td>{s.scores[0] || '—'}</td>
                  <td>{s.scores[1] || '—'}</td>
                  <td>{s.scores[2] || '—'}</td>
                  <td>{s.scores[3] || '—'}</td>
                  <td>{s.scores[4] || '—'}</td>
                </>
              )}
              <td>{s.grade}</td>
              <td>{s.achievement}</td>
              <td>{s.teacher}</td>
            </tr>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              {assessmentModel === "A1" && (
                <>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </>
              )}
              {assessmentModel === "U1" && (
                <>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </>
              )}
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
