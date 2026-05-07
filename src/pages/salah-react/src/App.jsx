function App() {
  return (
    <div>
      <h1>{import.meta.env.VITE_APP_NAME}</h1>
      <p>API: {import.meta.env.VITE_API_URL}</p>
    </div>
  )
}

export default App
