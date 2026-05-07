export function Comments({ comments }) {
  return (
    <section className="comments">
      <div>
        <strong>Class Teacher’s Comment:</strong>
        <p>{comments.classTeacher}</p>
      </div>

      <div>
        <strong>Head Teacher’s Comment:</strong>
        <p>{comments.headTeacher}</p>
      </div>
    </section>
  );
}