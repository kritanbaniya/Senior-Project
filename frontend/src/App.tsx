import { useState } from 'react'
import './style.css'
import Header from './Header'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Header />
    <div className="frame">
      <h1>CLINIC IQ</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          buton
        </button>
      </div>
      <p className="read-the-docs">
      </p>
    </div>
    </>
  )
}

export default App
