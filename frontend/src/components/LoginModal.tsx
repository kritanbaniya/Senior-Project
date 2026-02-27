// modal overlay that handles all authentication flows: login, signup (with role
// selection), and forgot-password. communicates directly with supabase auth.
// opened/closed via the loginOpen state in AuthContext; on successful login
// supabase fires an auth state change that AuthProvider picks up automatically.

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type LoginMode = 'login' | 'signup' | 'forgot'
type SignupRole = 'patient' | 'nurse' | 'doctor' | 'clinic' | null

// three-mode modal (login | signup | forgot). mode switches happen via
// in-modal links. the signup flow first asks for a role, then shows the
// registration form. all supabase calls use the anon key client.
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<LoginMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupFullName, setSignupFullName] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [signupRole, setSignupRole] = useState<SignupRole>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const resetState = () => {
    setMode('login')
    setUsername('')
    setPassword('')
    setSignupEmail('')
    setSignupPassword('')
    setSignupConfirmPassword('')
    setSignupFullName('')
    setResetEmail('')
    setSignupRole(null)
    setErrorMessage(null)
    setStatusMessage(null)
    setSubmitting(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // calls supabase.auth.signInWithPassword. on success the modal closes and
  // AuthProvider's onAuthStateChange listener loads the user's profile.
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        setSubmitting(false)
        return
      }

      setStatusMessage('logged in successfully')
      handleClose()
    } catch (err) {
      setErrorMessage('unable to log in right now')
      setSubmitting(false)
    }
  }

  // creates a new account via supabase.auth.signUp, passing the chosen role
  // and full name as user metadata. shows an email-verification prompt on success.
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    if (!signupRole) {
      setErrorMessage('please choose a role to continue')
      return
    }

    if (!signupFullName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      setErrorMessage('please fill out all fields')
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            role: signupRole,
            full_name: signupFullName,
          },
        },
      })

      if (error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('already') || errorMsg.includes('registered') || errorMsg.includes('exists')) {
          setErrorMessage('an account with this email already exists. please log in instead')
        } else {
          setErrorMessage(error.message)
        }
        setSubmitting(false)
        return
      }

      // supabase may return a "fake user" (no identities) when the email already exists
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setErrorMessage('an account with this email already exists. please log in instead')
        setSubmitting(false)
        return
      }

      setStatusMessage('account created successfully! please check your email to verify your account, then log in')
      setSubmitting(false)
      setTimeout(() => {
        setMode('login')
        setStatusMessage(null)
        setSignupEmail('')
        setSignupPassword('')
        setSignupConfirmPassword('')
        setSignupFullName('')
        setSignupRole(null)
      }, 3000)
    } catch (err) {
      setErrorMessage('unable to sign up right now')
      setSubmitting(false)
    }
  }

  // sends a password-reset email via supabase. the redirect url points to
  // /reset-password where the user sets a new password.
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    if (!resetEmail) {
      setErrorMessage('please enter your email')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setErrorMessage(error.message)
        setSubmitting(false)
        return
      }

      setStatusMessage('if an account with that email exists, a reset link has been sent')
      setSubmitting(false)
      setTimeout(() => handleClose(), 3000)
    } catch (err) {
      setErrorMessage('unable to send reset email right now')
      setSubmitting(false)
    }
  }

  const renderTitle = () => {
    if (mode === 'signup') {
      if (!signupRole) return 'choose your role'
      if (signupRole === 'clinic') return 'sign up as clinic'
      return `sign up as ${signupRole}`
    }
    if (mode === 'forgot') return 'reset password'
    return 'login'
  }

  return (
    <div className="login-overlay" onClick={handleClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="login-close" onClick={handleClose} aria-label="close">
          x
        </button>
        <h2 className="login-title">{renderTitle()}</h2>

        {errorMessage && (
          <div className="login-message login-error">
            {errorMessage}
          </div>
        )}

        {statusMessage && (
          <div className="login-message login-status">
            {statusMessage}
          </div>
        )}

        {mode === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="login-username">email</label>
                <input
                  id="login-username"
                  type="email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="enter your email"
                  autoComplete="email"
                />
              </div>
              <div className="login-field">
                <label htmlFor="login-password">password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="enter your password"
                  autoComplete="current-password"
                />
              </div>
              <div className="login-actions">
                <button type="submit" className="login-submit" disabled={submitting}>
                  {submitting ? 'logging in...' : 'login'}
                </button>
                <button type="button" className="login-cancel" onClick={handleClose}>cancel</button>
              </div>
            </form>
            <div className="login-link-row">
              <button
                type="button"
                className="login-link-button"
                onClick={() => setMode('signup')}
              >
                do not have an account? sign up
              </button>
              <button
                type="button"
                className="login-link-button"
                onClick={() => setMode('forgot')}
              >
                forgot password?
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <>
            {!signupRole && (
              <>
                <div className="signup-role-grid">
                  <button
                    type="button"
                    className="signup-role-button"
                    onClick={() => setSignupRole('patient')}
                  >
                    i am a patient
                  </button>
                  <button
                    type="button"
                    className="signup-role-button"
                    onClick={() => setSignupRole('nurse')}
                  >
                    i am a nurse
                  </button>
                  <button
                    type="button"
                    className="signup-role-button"
                    onClick={() => setSignupRole('doctor')}
                  >
                    i am a doctor
                  </button>
                  <button
                    type="button"
                    className="signup-role-button"
                    onClick={() => setSignupRole('clinic')}
                  >
                    i am a clinic
                  </button>
                </div>
                <div className="login-link-row">
                  <button
                    type="button"
                    className="login-link-button"
                    onClick={() => setMode('login')}
                  >
                    already have an account? log in
                  </button>
                </div>
              </>
            )}

            {signupRole && (
              <>
                <div className="signup-role-label">
                  signing up as{' '}
                  {signupRole === 'clinic' ? 'clinic' : signupRole}
                </div>
                <form onSubmit={handleSignupSubmit} className="login-form">
                  <div className="login-field">
                    <label htmlFor="signup-full-name">full name</label>
                    <input
                      id="signup-full-name"
                      type="text"
                      value={signupFullName}
                      onChange={e => setSignupFullName(e.target.value)}
                      placeholder="enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  <div className="login-field">
                    <label htmlFor="signup-email">email</label>
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="enter your email"
                      autoComplete="email"
                    />
                  </div>
                  <div className="login-field">
                    <label htmlFor="signup-password">password</label>
                    <input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="create a password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="login-field">
                    <label htmlFor="signup-confirm-password">confirm password</label>
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={e => setSignupConfirmPassword(e.target.value)}
                      placeholder="confirm your password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="login-actions">
                    <button type="submit" className="login-submit" disabled={submitting}>
                      {submitting ? 'signing up...' : 'sign up'}
                    </button>
                    <button type="button" className="login-cancel" onClick={handleClose}>cancel</button>
                  </div>
                </form>
                <div className="login-link-row">
                  <button
                    type="button"
                    className="login-link-button"
                    onClick={() => setSignupRole(null)}
                  >
                    change role
                  </button>
                  <button
                    type="button"
                    className="login-link-button"
                    onClick={() => setMode('login')}
                  >
                    already have an account? log in
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {mode === 'forgot' && (
          <>
            <form onSubmit={handleForgotSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="reset-email">email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="enter your login email"
                  autoComplete="email"
                />
              </div>
              <div className="login-actions">
                <button type="submit" className="login-submit" disabled={submitting}>
                  {submitting ? 'sending...' : 'send reset link'}
                </button>
                <button type="button" className="login-cancel" onClick={handleClose}>cancel</button>
              </div>
            </form>
            <div className="login-link-row">
              <button
                type="button"
                className="login-link-button"
                onClick={() => setMode('login')}
              >
                back to login
              </button>
              <button
                type="button"
                className="login-link-button"
                onClick={() => setMode('signup')}
              >
                do not have an account? sign up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}