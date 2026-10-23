import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getSocket } from '../services/socket';
import SummaryCard from '../components/SummaryCard';
import TransactionTable from '../components/TransactionTable';
import AlertCard from '../components/AlertCard';
import Modal from '../components/Modal';
import RiskBadge from '../components/RiskBadge';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Bell,
  ArrowRight,
  TrendingUp,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    pendingAlerts: 0,
    approvedCount: 0,
    reviewCount: 0,
    blockedCount: 0
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time incoming toast alert
  const [liveBannerAlert, setLiveBannerAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null); // { type: 'approve' | 'block', txn }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentTransactions(res.data.recentTransactions);
        setRecentAlerts(res.data.recentAlerts);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Socket.IO real-time alert listener
    const socket = getSocket();
    socket.emit('join_admin');

    const handleNewAlert = (alertData) => {
      console.log('[AdminDashboard] Live Real-time Alert received:', alertData);
      setLiveBannerAlert(alertData);

      // Play chime sound if enabled
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
          // Audio autoplay block fallback
        }
      }

      // Update counters without page refresh
      setStats((prev) => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        pendingAlerts: prev.pendingAlerts + 1,
        mediumRiskCount: alertData.riskLevel === 'MEDIUM' ? prev.mediumRiskCount + 1 : prev.mediumRiskCount,
        highRiskCount: alertData.riskLevel === 'HIGH' ? prev.highRiskCount + 1 : prev.highRiskCount
      }));

      // Prepend to alerts list
      setRecentAlerts((prev) => [alertData, ...prev.slice(0, 4)]);

      // Prepend or update transactions list
      if (alertData.transaction) {
        const newTxn = {
          _id: alertData._id,
          transactionId: alertData.transactionId,
          sender: alertData.transaction.sender || alertData.userId?.name || 'Customer',
          receiver: alertData.transaction.receiver,
          beneficiary: alertData.transaction.beneficiary,
          amount: alertData.transaction.amount,
          riskScore: alertData.riskScore,
          riskLevel: alertData.riskLevel,
          status: alertData.transaction.status || (alertData.riskLevel === 'HIGH' ? 'BLOCKED' : 'REVIEW'),
          suspiciousReasons: alertData.reasons,
          createdAt: alertData.createdAt
        };
        setRecentTransactions((prev) => [newTxn, ...prev.slice(0, 4)]);
      }
    };

    socket.on('fraud_alert', handleNewAlert);
    socket.on('new_fraud_alert', handleNewAlert);

    return () => {
      socket.off('fraud_alert', handleNewAlert);
      socket.off('new_fraud_alert', handleNewAlert);
    };
  }, [soundEnabled]);

  const handleApprove = (txn) => {
    setActionConfirm({ type: 'approve', txn });
  };

  const handleBlock = (txn) => {
    setActionConfirm({ type: 'block', txn });
  };

  const confirmAction = async () => {
    if (!actionConfirm) return;
    const { type, txn } = actionConfirm;

    try {
      setActionLoading(true);
      const url = `/admin/transactions/${txn._id || txn.id}/${type}`;
      const res = await API.put(url);
      if (res.data.success) {
        // Refresh dashboard
        await fetchDashboardData();
        setActionConfirm(null);
        if (selectedTxn && selectedTxn.transactionId === txn.transactionId) {
          setSelectedTxn({
            ...selectedTxn,
            status: type === 'approve' ? 'APPROVED' : 'BLOCKED'
          });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${type} transaction`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewAlert = async (alertId, status = 'RESOLVED') => {
    try {
      const res = await API.put(`/admin/alerts/${alertId}/review`, { status });
      if (res.data.success) {
        setRecentAlerts((prev) =>
          prev.map((a) => (a._id === alertId ? { ...a, status } : a))
        );
        setStats((prev) => ({
          ...prev,
          pendingAlerts: Math.max(0, prev.pendingAlerts - 1)
        }));
      }
    } catch (err) {
      console.error('Error reviewing alert:', err);
    }
  };

  return (
    <div>
      {/* Real-Time Alert Banner Popup when Socket.IO event triggers */}
      {liveBannerAlert && (
        <div className="realtime-alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#ffffff', color: '#dc2626', padding: '8px', borderRadius: '10px' }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.02em' }}>
                  🚨 REAL-TIME FRAUD ALERT DETECTED
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {liveBannerAlert.riskLevel} RISK ({liveBannerAlert.riskScore}/100)
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '2px', opacity: 0.95 }}>
                Transaction <strong>{liveBannerAlert.transactionId}</strong> • Amount: ₹{Number(liveBannerAlert.transaction?.amount || 0).toLocaleString('en-IN')} • {liveBannerAlert.reasons?.[0] || 'Unusual behavior flag'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/admin/alerts"
              className="btn btn-outline btn-sm"
              style={{ background: '#ffffff', color: '#991b1b', borderColor: '#ffffff', fontWeight: 700 }}
            >
              Investigate
            </Link>
            <button
              onClick={() => setLiveBannerAlert(null)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Header controls: Sound toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Toggle audio alert chime for incoming transactions"
        >
          {soundEnabled ? <Volume2 size={15} color="#059669" /> : <VolumeX size={15} color="#dc2626" />}
          <span>Audio Chime: {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Top Summary Cards (Requested) */}
      <div className="stats-grid">
        <SummaryCard
          title="Total Transactions"
          value={stats.totalTransactions}
          subtitle="Monitored across system"
          icon={<FileSpreadsheet size={24} />}
          variant="primary"
        />
        <SummaryCard
          title="Low Risk"
          value={stats.lowRiskCount}
          subtitle="Safe / Auto-approved"
          icon={<CheckCircle size={24} />}
          variant="success"
        />
        <SummaryCard
          title="Medium Risk"
          value={stats.mediumRiskCount}
          subtitle="Held for manual review"
          icon={<AlertTriangle size={24} />}
          variant="warning"
        />
        <SummaryCard
          title="High Risk"
          value={stats.highRiskCount}
          subtitle="Flagged / Auto-blocked"
          icon={<ShieldAlert size={24} />}
          variant="danger"
        />
        <SummaryCard
          title="Pending Alerts"
          value={stats.pendingAlerts}
          subtitle="Unresolved anomalies"
          icon={<Bell size={24} />}
          variant="purple"
        />
      </div>

      {/* Grid: Recent Transactions (Left) + Live Alert Feed (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Transaction Monitoring Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={20} color="#2563eb" />
              <span>Real-Time Transaction Stream</span>
            </div>
            <Link
              to="/admin/transactions"
              style={{
                fontSize: '0.85rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All Transactions</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <TransactionTable
            transactions={recentTransactions}
            isAdmin={true}
            onViewDetails={(txn) => setSelectedTxn(txn)}
            onApprove={handleApprove}
            onBlock={handleBlock}
          />
        </div>

        {/* Right: Real-Time Fraud Alert Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={20} color="#ef4444" />
              <span>Active Fraud Alerts</span>
            </div>
            <Link
              to="/admin/alerts"
              style={{
                fontSize: '0.85rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              All Alerts
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                No active fraud alerts
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Real-time alerts will appear automatically via Socket.IO
              </div>
            </div>
          ) : (
            recentAlerts.map((alert) => (
              <AlertCard
                key={alert._id || alert.transactionId}
                alert={alert}
                onReview={handleReviewAlert}
                onViewTxn={(txnId) => {
                  const match = recentTransactions.find((t) => t.transactionId === txnId);
                  if (match) setSelectedTxn(match);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Transaction Inspection Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`Audit Transaction – ${selectedTxn.transactionId}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <RiskBadge level={selectedTxn.riskLevel} score={selectedTxn.riskScore} />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: selectedTxn.status === 'APPROVED' ? '#ecfdf5' : selectedTxn.status === 'REVIEW' ? '#fffbeb' : '#fef2f2',
                color: selectedTxn.status === 'APPROVED' ? '#065f46' : selectedTxn.status === 'REVIEW' ? '#92400e' : '#991b1b'
              }}
            >
              STATUS: {selectedTxn.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{Number(selectedTxn.amount).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Customer (Sender)</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedTxn.sender}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Receiver</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedTxn.receiver}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Beneficiary Account</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{selectedTxn.beneficiary}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Device Fingerprint</div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{selectedTxn.deviceId}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Location</div>
              <div style={{ fontSize: '0.85rem' }}>{selectedTxn.location}</div>
            </div>
          </div>

          {selectedTxn.suspiciousReasons && selectedTxn.suspiciousReasons.length > 0 && (
            <div style={{ marginTop: '16px', background: '#fef2f2', border: '1px solid #fecaca', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#991b1b', marginBottom: '8px' }}>
                🚨 Rule Violations Detected:
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: '#7f1d1d' }}>
                {selectedTxn.suspiciousReasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons inside inspection modal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            {selectedTxn.status !== 'APPROVED' && (
              <button
                className="btn btn-success"
                onClick={() => {
                  setSelectedTxn(null);
                  handleApprove(selectedTxn);
                }}
              >
                <CheckCircle size={16} />
                <span>Manually Approve</span>
              </button>
            )}

            {selectedTxn.status !== 'BLOCKED' && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  setSelectedTxn(null);
                  handleBlock(selectedTxn);
                }}
              >
                <ShieldAlert size={16} />
                <span>Block Immediately</span>
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Approve / Block */}
      {actionConfirm && (
        <Modal
          isOpen={!!actionConfirm}
          onClose={() => setActionConfirm(null)}
          title={`Confirm ${actionConfirm.type === 'approve' ? 'Manual Approval' : 'Fraud Block'}`}
          maxWidth="460px"
        >
          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px' }}>
            Are you sure you want to mark transaction <strong>{actionConfirm.txn.transactionId}</strong> (₹{Number(actionConfirm.txn.amount).toLocaleString('en-IN')}) as <strong>{actionConfirm.type.toUpperCase()}ED</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setActionConfirm(null)}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              className={`btn ${actionConfirm.type === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={confirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : `Confirm ${actionConfirm.type === 'approve' ? 'Approval' : 'Block'}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
