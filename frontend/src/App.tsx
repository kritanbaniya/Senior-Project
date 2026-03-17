import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ClinicProvider } from './context/ClinicContext'
import RootLayout from './layouts/RootLayout'
import DashboardGuard from './layouts/DashboardGuard'
import RoleGuard from './layouts/RoleGuard'
import ClinicDiscovery from './pages/Dashboard/Patient/ClinicDiscovery/ClinicDiscoveryPage'
import ClinicInfo from './pages/ClinicInfo'
import ResetPassword from './pages/ResetPassword'
import PatientDashboard from './pages/Dashboard/Patient/PatientDashboard'
import PatientYourInformation from './pages/Dashboard/Patient/PatientYourInformation'
import NurseDashBoard from './pages/Dashboard/Nurse/NurseDashBoard'
import NurseYourInformation from './pages/Dashboard/Nurse/Nurseinformation'
import DoctorDashBoard from './pages/Dashboard/Doctor/DoctorDashBoard'
import DoctorYourInformation from './pages/Dashboard/Doctor/DoctorInformation'
import ClinicADashBoard from './pages/Dashboard/Clinic/ClinicADashBoard'
import Support from './pages/Support'
import HomeGate from './pages/HomeGate'

/**
 * This file defines the main App component, which sets up the routing for the application.
 * It uses React Router to define routes for the homepage, clinic nearby, clinic discovery, clinic info, reset password, and dashboard pages.
 * The dashboard routes are protected by authentication and role-based guards to ensure that only authorized users can access them.
 * The AuthProvider and ClinicProvider components are used to provide authentication and clinic-related context to the entire application.
 * The path "/" is manipulated with the help of HomeGate. It redirects users to their respective dashboard
*/

export default function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomeGate />} />
            <Route path="/clinic" element={<ClinicInfo />} />
            <Route path="/clinic-discovery" element={<ClinicDiscovery />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/support" element={<Support />} />

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
                <Route path="information" element={<DoctorYourInformation />} />
              </Route>
              <Route path="clinic" element={<RoleGuard allowedRole="clinic" />}>
                <Route index element={<ClinicADashBoard />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </ClinicProvider>
    </AuthProvider>
  )
}