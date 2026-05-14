import { Link, useLocation } from 'react-router-dom'
import type { ClinicRow } from './Dashboard/Clinic/ClinicADashBoard'
import  { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Users, Clock } from 'lucide-react'; // 增加图标


interface ExtendedClinicRow extends ClinicRow {
  id: string; 
}
const formatSeconds = (sec: number | null) => {
  if (sec == null) return '--';

  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;

  if (minutes <= 0) return `${seconds}s`;

  return `${minutes}m ${seconds}s`;
};

export default function ClinicInfo() {
  const location = useLocation()
  const state = location.state as { clinicId?: string; clinic?: ExtendedClinicRow } | null
  const clinic = state?.clinic
  const clinicid = state?.clinicId
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [waitingCount, setWaitingCount] = useState(0);
  const [avgServiceTime, setAvgServiceTime] = useState<number | null>(null);

  const { profile: authProfile} = useAuth();
  const isLoggedIn = !!authProfile;

  useEffect(() => {
    if (clinicid &&isLoggedIn) {
      fetchQueueData();
    }
  }, [clinicid, isLoggedIn]);
  const fetchQueueData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_queue_stats', {
        cid: clinicid
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];

        setWaitingCount(stats.waiting_count);
        setAvgServiceTime(stats.avg_service_seconds);
      }

    } catch (error) {
      console.error('Error fetching queue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (c: ClinicRow) => {
    const parts = [c.address_line1, c.address_line2, c.city, c.state, c.zip_code].filter(Boolean)
    return parts.length ? parts.join(', ') : 'No address available'
  }

const estimatedWait =
  avgServiceTime != null
    ? waitingCount * avgServiceTime
    : (waitingCount > 0 ? 'Calculating...' : 'No wait');

  if (!clinic) {
    return (
      <div className="clinic-info-page">
        <h1 className="page-title">Clinic Information</h1>
        <div className="info-box clinic-box">
          <h2 className="info-box-title">No clinic selected</h2>
          <div className="info-box-content">
            <p>Please go back and choose a clinic first.</p>
          </div>
        </div>
        <Link to="/clinic-discovery" className="back-link">← Back</Link>
      </div>
    )
  }

  return (
    <div className="clinic-info-page">
      <h1 className="page-title">Clinic Information</h1>


      <div className="info-box clinic-box">
        <h2 className="info-box-title">Clinic Details</h2>
        <div className="info-box-content">
          <p><strong>Clinic Name:</strong> {clinic.clinic_name}</p>
          <p><strong>Address:</strong> {formatAddress(clinic)}</p>
          <p><strong>Phone:</strong> {clinic.phone ?? 'Not provided'}</p>
          <p><strong>Specialty:</strong> {clinic.specialty ?? 'Not specified'}</p>
          {clinic.email && <p><strong>Email:</strong> {clinic.email}</p>}
          {clinic.website && <p><strong>Website:</strong> <a href={clinic.website} target="_blank" rel="noopener noreferrer">{clinic.website}</a></p>}
        </div>
      </div>


      <div className="info-box queue-box">
        <h2 className="info-box-title">Live Queue Status</h2>
        <div className="info-box-content">
          {!isLoggedIn ? (
            <div className="login-prompt" style={{ color: '#d9534f', padding: '10px 0' }}>
              <p>Please <strong>Login</strong> to see current waiting list and estimated times.</p>
              
            </div>
          ) : loading ? (
            <div className="loading-state"><Loader2 className="animate-spin" /> Updating...</div>
          ) : (
            <div className="queue-stats">
              <div className="stat-item">
                <Users size={18} /> 
                <span><strong>Waiting Patients:</strong> {waitingCount} people</span>
              </div>
              <div className="stat-item">
                <Clock size={18} />
                <span>
                  <strong>Est. Wait Time:</strong> {
                    typeof estimatedWait === 'number'
                      ? formatSeconds(estimatedWait)
                      : estimatedWait
                  }
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
                * Average consult duration: {formatSeconds(avgServiceTime)}
              </p>
            </div>
          )}
        </div>
      </div>

      <Link to="/clinic-discovery" className="back-link">← Back</Link>
    </div>
  )
}