import React, { useState, useEffect } from 'react';
import API from '../services/api';
import AlertCard from '../components/AlertCard';
import Modal from '../components/Modal';
import RiskBadge from '../components/RiskBadge';
import { AlertTriangle, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Investigation Modal
  const [investigatingTxn, setInvestigatingTxn] = useState(null);
  const [investigatingLoading, setInvestigatingLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/alerts', {
        params: {
          status: statusFilter,
          riskLevel: riskFilter
        }
      });
      if (res.data.success) {
        setAlerts(res.data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, riskFilter]);

  const handleReviewAlert = async (alertId, status = 'RESOLVED') => {
    try {
      const res = await API.put(`/admin/alerts/${alertId}/review`, { status });
      if (res.data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? { ...a, status } : a))
        );
      }
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };

  const handleInvestigateTxn = async (transactionId) => {
    try {
      setInvestigatingLoading(true);
      const res = await API.get('/admin/transactions', {
        params: { search: transactionId }
      });
      if (res.data.success && res.data.transactions.length > 0) {
        setInvestigatingTxn(res.data.transactions[0]);
      } else {
        alert('Transaction record could not be loaded.');
      }
    } catch (err) {
      alert('Error fetching transaction details');
    } finally {
      setInvestigatingLoading(false);
    }
  };

  return (
    <div>
      {/* Filter Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Fraud Alert Monitoring Center</h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#64748b" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New (Unreviewed)</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Risk:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={fetchAlerts}
              title="Refresh alerts"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading fraud alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={44} color="#10b981" className="empty-state-icon" />
            <h4 style={{ color: '#1e293b', fontWeight: 700 }}>No Fraud Alerts Found</h4>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
              All transactions matching current filters are compliant.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onReview={handleReviewAlert}
              onViewTxn={handleInvestigateTxn}
            />
          ))
        )}
      </div>

      {/* Transaction Investigation Modal */}
      {investigatingTxn && (
        <Modal
          isOpen={!!investigatingTxn}
          onClose={() => setInvestigatingTxn(null)}
          title={`Alert Investigation – ${investigatingTxn.transactionId}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <RiskBadge level={investigatingTxn.riskLevel} score={investigatingTxn.riskScore} />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: investigatingTxn.status === 'APPROVED' ? '#ecfdf5' : investigatingTxn.status === 'REVIEW' ? '#fffbeb' : '#fef2f2',
                color: investigatingTxn.status === 'APPROVED' ? '#065f46' : investigatingTxn.status === 'REVIEW' ? '#92400e' : '#991b1b'
              }}
            >
              STATUS: {investigatingTxn.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{Number(investigatingTxn.amount).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Customer Name</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{investigatingTxn.sender}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Target Receiver</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{investigatingTxn.receiver}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Beneficiary Account</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{investigatingTxn.beneficiary}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Device Fingerprint</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{investigatingTxn.deviceId}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Location</div>
              <div style={{ fontSize: '0.85rem' }}>{investigatingTxn.location}</div>
            </div>
          </div>

          {investigatingTxn.suspiciousReasons && investigatingTxn.suspiciousReasons.length > 0 && (
            <div style={{ marginTop: '16px', background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#991b1b', marginBottom: '8px' }}>
                🚨 Flagged Reasons:
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: '#7f1d1d' }}>
                {investigatingTxn.suspiciousReasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminAlerts;
