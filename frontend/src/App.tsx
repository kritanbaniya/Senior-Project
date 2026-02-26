import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RootLayout from './layouts/RootLayout'
import DashboardGuard from './layouts/DashboardGuard'
import RoleGuard from './layouts/RoleGuard'
import HomePage from './pages/HomePage'
import ClinicNearby from './pages/ClinicNearby'
import ClinicInfo from './pages/ClinicInfo'
import ResetPassword from './pages/ResetPassword'
import PatientDashboard from './pages/Dashboard/Patient/PatientDashboard'
import PatientYourInformation from './pages/Dashboard/Patient/PatientYourInformation'
import NurseDashBoard from './pages/Dashboard/Nurse/NurseDashBoard'
import NurseYourInformation from './pages/Dashboard/Nurse/Nurseinformation'
import DoctorDashBoard from './pages/Dashboard/Doctor/DoctorDashBoard'
import ClinicADashBoard from './pages/Dashboard/Clinic/ClinicADashBoard'
import './style.css'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clinic-nearby" element={<ClinicNearby />} />
          <Route path="/clinic" element={<ClinicInfo />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<DashboardGuard />}>
            <Route path="patient" element={<RoleGuard allowedRole="patient" />}>
              <Route index element={<PatientDashboard />} />
              <Route path="information" element={<PatientYourInformation />} />
            </Route>
            <Route path="nurse" element={<RoleGuard allowedRole="nurse" />}>
              <Route index element={<NurseDashBoard />} />
              <Route path="information" element={<NurseYourInformation />} />
            </Route>
            <Route path="doctor" element={<RoleGuard allowedRole="doctor" />}>
              <Route index element={<DoctorDashBoard />} />
            </Route>
            <Route path="clinic" element={<RoleGuard allowedRole="clinic" />}>
              <Route index element={<ClinicADashBoard />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
