// src/App.tsx
import './index.css' // Ensures Tailwind styles are loaded
import DoctorPrescriptionApp from './components/DoctorPrescriptionApp'

function App() {
  return (
    <div className="container mx-auto p-4"> {/* Optional container styling */}
      <DoctorPrescriptionApp />
    </div>
  )
}

export default App