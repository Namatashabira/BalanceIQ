import { useState } from 'react';

export function StudentBio({ student }) {
  const [photoSrc, setPhotoSrc] = useState(student.photo || '');

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoSrc(URL.createObjectURL(file));
  }

  return (
    <section className="student-bio">

      <label className="photo-upload-label" title="Click to upload student photo">
        <div className="photo-box">
          {photoSrc
            ? <img src={photoSrc} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="photo-placeholder-text">Upload<br />Photo</span>
          }
        </div>
        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
      </label>

      <table className="bio-table">
        <tbody>
          <tr>
            <th>Name</th>
            <td>{student.name}</td>
            <th>Gender</th>
            <td>{student.gender}</td>
            <th>Section</th>
            <td>{student.section}</td>
          </tr>
          <tr>
            <th>Class</th>
            <td>{student.class}</td>
            <th>Stream</th>
            <td>{student.stream}</td>
            <th>ID No</th>
            <td>{student.idNo}</td>
          </tr>
          <tr>
            <th>Pay Code</th>
            <td>{student.payCode}</td>
            <th>Term</th>
            <td>{student.term}</td>
            <th>Academic Year</th>
            <td>{student.year}</td>
          </tr>
        </tbody>
      </table>

    </section>
  );
}
