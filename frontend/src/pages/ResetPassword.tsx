import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStatusMessage(null)

    if (!password || !confirmPassword) {
      setErrorMessage('please fill out both password fields')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        setSubmitting(false)
        return
      }

      await supabase.auth.signOut()
      setPasswordReset(true)
      setStatusMessage('your password has been updated. redirecting to login...')
      setTimeout(() => {
        navigate('/')
      }, 2500)
    } catch (err) {
      setErrorMessage('unable to update password right now')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="reset-page">
      <div className="info-box">
        <h1 className="page-title">reset password</h1>
        {passwordReset ? (
          <div className="login-message login-status">
            {statusMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="new-password">new password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="enter a new password"
              />
            </div>
            <div className="login-field">
              <label htmlFor="confirm-new-password">confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="confirm your new password"
              />
            </div>

            {errorMessage && (
              <div className="login-message login-error">
                {errorMessage}
              </div>
            )}

            <div className="login-actions">
              <button type="submit" className="login-submit" disabled={submitting}>
                {submitting ? 'updating...' : 'update password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}