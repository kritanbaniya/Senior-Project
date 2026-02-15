import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './style.css'
import Header from './Header'
import ClinicInfo from './pages/ClinicInfo'
import LoginModal from './components/LoginModal'
import ResetPassword from './pages/ResetPassword'
import { supabase } from './lib/supabase'

function HomePage() {
  const navigate = useNavigate()
  return (
    <div className="home-page info-box">
      <h1 className="page-title">CLINIC Nearby</h1>
      <div className="frame">
        <h1 className="left_title">CLINIC 1</h1>
        <h2 className="left_title">Location...</h2>
        <h2 className="left_title">...</h2>
        <div className="card">
          <button onClick={() => navigate('/clinic')}>
            Check
          </button>
        </div>
        <p className="read-the-docs" />
      </div>
    </div>
  )
}

function App() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile({ full_name: data.full_name })
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (user) {
        await loadProfile(user.id)
      }
      setLoadingProfile(false)
    }

    void init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user) {
        void loadProfile(user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <>
      <Header
        onLoginClick={() => setLoginOpen(true)}
        onLogoutClick={handleLogout}
        isLoggedIn={!!profile}
        fullName={profile?.full_name ?? null}
      />
      {!loadingProfile && profile && (
        <div className="welcome-banner">
          welcome {profile.full_name ?? 'user'}
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clinic" element={<ClinicInfo />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}

export default App