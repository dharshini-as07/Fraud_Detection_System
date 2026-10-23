import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Send,
  QrCode,
  Building2,
  Smartphone,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ShieldBan,
  Eye,
  Copy,
  Check
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const upiId = user?.name
    ? `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`
    : 'user@okhdfcbank';

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions');
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const copyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const formatTxnDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const timeStr = d
      .toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      .toUpperCase();

    const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateMonth = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    if (isToday) return `Today (${dayOfWeek}, ${dateMonth}) • ${timeStr}`;
    if (isYesterday) return `Yesterday (${dayOfWeek}, ${dateMonth}) • ${timeStr}`;
    return `${dayOfWeek}, ${dateMonth} • ${timeStr}`;
  };

  // Iconic GPay Recent People Contacts
  const recentPeople = [
    { name: 'Priya Verma', upi: 'ACC-SBI-1001', bg: '#4285f4', initial: 'P', preset: 'low' },
    { name: 'Apex Store', upi: 'ACC-ICICI-8888', bg: '#ea4335', initial: 'A', preset: 'medium' },
    { name: 'MSEB Electricity', upi: 'ACC-MSEB-4004', bg: '#fbbc05', initial: 'M', preset: 'low' },
    { name: 'Tokyo Tech', upi: 'ACC-TOKYO-BANK-77', bg: '#34a853', initial: 'T', preset: 'high' }
  ];

  const handlePayPerson = (person) => {
    navigate('/create-transaction', { state: { preset: person.preset, receiver: person.name, beneficiary: person.upi } });
  };

  // Metrics
  const totalCount = transactions.length;

  return (
    <div className="gpay-view-container">
      {/* GPay Hero Profile Header */}
      <div className="gpay-hero-card">
        <div className="gpay-hero-left">
          <div className="gpay-user-avatar-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>{user?.name || 'Customer'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="gpay-upi-tag" onClick={copyUpi} style={{ cursor: 'pointer' }} title="Click to copy UPI ID">
                <span>UPI ID: {upiId}</span>
                {copiedUpi ? <Check size={13} color="#86efac" /> : <Copy size={13} />}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>FraudShield Protected</span>
          </div>
        </div>
      </div>

      {/* Linked Bank Account Card */}
      <div className="gpay-bank-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Building2 size={24} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>State Bank of India</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Savings Account •••• 1001 (Primary)</div>
          </div>
        </div>

        <div>
          {balanceVisible ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>₹75,420.00</div>
              <button
                onClick={() => setBalanceVisible(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Hide Balance
              </button>
            </div>
          ) : (
            <button
              onClick={() => setBalanceVisible(true)}
              className="btn btn-outline btn-sm"
              style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}
            >
              Check Balance
            </button>
          )}
        </div>
      </div>


      {/* Iconic GPay Quick Pay Contacts (People Circles) */}
      <div className="gpay-people-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#202124' }}>Recent Contacts</span>
          <Link to="/create-transaction" style={{ fontSize: '0.82rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>
            New Payment +
          </Link>
        </div>

        <div className="gpay-people-grid">
          {recentPeople.map((person, idx) => (
            <button
              key={idx}
              className="gpay-person-item"
              onClick={() => handlePayPerson(person)}
              title={`Pay ${person.name}`}
            >
              <div className="gpay-person-avatar" style={{ backgroundColor: person.bg }}>
                {person.initial}
              </div>
              <span className="gpay-person-name">{person.name}</span>
            </button>
          ))}
          <Link
            to="/create-transaction"
            className="gpay-person-item"
            style={{ textDecoration: 'none' }}
          >
            <div className="gpay-person-avatar" style={{ background: '#f1f3f4', color: '#1a73e8', border: '1px dashed #1a73e8' }}>
              +
            </div>
            <span className="gpay-person-name">Pay Anyone</span>
          </Link>
        </div>
      </div>

      {/* GPay Action Tiles */}
      <div className="gpay-actions-row">
        <Link to="/scan-qr" className="gpay-action-tile">
          <div className="gpay-action-icon">
            <QrCode size={22} />
          </div>
          <span className="gpay-action-label">Scan QR</span>
        </Link>
        <Link to="/create-transaction" className="gpay-action-tile">
          <div className="gpay-action-icon">
            <Smartphone size={22} />
          </div>
          <span className="gpay-action-label">Pay Phone / UPI</span>
        </Link>
        <Link to="/bank-transfer" className="gpay-action-tile">
          <div className="gpay-action-icon">
            <Building2 size={22} />
          </div>
          <span className="gpay-action-label">Bank Transfer</span>
        </Link>
        <Link to="/transactions" className="gpay-action-tile">
          <div className="gpay-action-icon">
            <CreditCard size={22} />
          </div>
          <span className="gpay-action-label">Passbook</span>
        </Link>
      </div>

      {/* Recent UPI Activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent UPI Payments</span>
          <Link to="/transactions" style={{ fontSize: '0.85rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>
            View All ({totalCount})
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#5f6368' }}>Loading UPI passbook...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <Send size={40} className="empty-state-icon" />
            <p style={{ fontWeight: 600 }}>No payments sent yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click "Pay Anyone" above to send your first transfer.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.slice(0, 5).map((txn) => (
              <div
                key={txn._id || txn.transactionId}
                onClick={() => setSelectedTxn(txn)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid #f1f3f4',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafd')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: txn.status === 'APPROVED' ? '#e6f4ea' : txn.status === 'REVIEW' ? '#fef7e0' : '#fce8e6',
                      color: txn.status === 'APPROVED' ? '#1e8e3e' : txn.status === 'REVIEW' ? '#e37400' : '#d93025',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    {txn.receiver ? txn.receiver.charAt(0).toUpperCase() : '₹'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>
                      Paid to {txn.receiver}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#5f6368', marginTop: '2px' }}>
                      {formatTxnDate(txn.timestamp || txn.createdAt)} • {txn.beneficiary}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#202124' }}>
                    -₹{Number(txn.amount).toLocaleString('en-IN')}
                  </div>
                  <div style={{ marginTop: '3px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: txn.status === 'APPROVED' ? '#e6f4ea' : txn.status === 'REVIEW' ? '#fef7e0' : '#fce8e6',
                        color: txn.status === 'APPROVED' ? '#137333' : txn.status === 'REVIEW' ? '#b06000' : '#c5221f',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {txn.status === 'APPROVED' && <CheckCircle2 size={11} />}
                      {txn.status === 'REVIEW' && <Clock size={11} />}
                      {txn.status === 'BLOCKED' && <ShieldBan size={11} />}
                      <span>{txn.status === 'APPROVED' ? 'Completed' : txn.status === 'REVIEW' ? 'Under Review' : 'Failed'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`UPI Transaction Receipt`}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: selectedTxn.status === 'APPROVED' ? '#e6f4ea' : selectedTxn.status === 'REVIEW' ? '#fef7e0' : '#fce8e6',
                color: selectedTxn.status === 'APPROVED' ? '#1e8e3e' : selectedTxn.status === 'REVIEW' ? '#e37400' : '#d93025',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              {selectedTxn.status === 'APPROVED' && <CheckCircle2 size={32} />}
              {selectedTxn.status === 'REVIEW' && <Clock size={32} />}
              {selectedTxn.status === 'BLOCKED' && <ShieldBan size={32} />}
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#202124' }}>
              ₹{Number(selectedTxn.amount).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#5f6368', marginTop: '4px' }}>
              Paid to {selectedTxn.receiver} ({selectedTxn.beneficiary})
            </div>
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: selectedTxn.status === 'APPROVED' ? '#e6f4ea' : selectedTxn.status === 'REVIEW' ? '#fef7e0' : '#fce8e6',
                  color: selectedTxn.status === 'APPROVED' ? '#1e8e3e' : selectedTxn.status === 'REVIEW' ? '#e37400' : '#d93025'
                }}
              >
                {selectedTxn.status === 'APPROVED' ? 'Payment Successful' : selectedTxn.status === 'REVIEW' ? 'Payment Under Review' : 'Payment Failed'}
              </span>
            </div>
          </div>

          <div style={{ background: '#f8fafd', padding: '16px', borderRadius: '14px', marginBottom: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#5f6368' }}>UPI Transaction ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedTxn.transactionId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#5f6368' }}>Status</span>
              <span style={{ fontWeight: 700, color: selectedTxn.status === 'APPROVED' ? '#1e8e3e' : selectedTxn.status === 'REVIEW' ? '#e37400' : '#d93025' }}>
                {selectedTxn.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#5f6368' }}>Debited From</span>
              <span style={{ fontWeight: 600 }}>State Bank of India (•••• 1001)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#5f6368' }}>Location</span>
              <span>{selectedTxn.location}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#5f6368' }}>Timestamp</span>
              <span>{new Date(selectedTxn.timestamp || selectedTxn.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerDashboard;
