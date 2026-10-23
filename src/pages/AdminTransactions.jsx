import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TransactionTable from '../components/TransactionTable';
import Modal from '../components/Modal';
import RiskBadge from '../components/RiskBadge';
import { Search, Filter, RefreshCw, FileSpreadsheet, CheckCircle, ShieldAlert } from 'lucide-react';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Modals & actions
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/transactions', {
        params: {
          search,
          status: statusFilter,
          riskLevel: riskFilter
        }
      });
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error('Error fetching admin transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

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
        await fetchTransactions();
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

  return (
    <div>
      {/* Search and Filter Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 320px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by ID, Customer Name, Receiver, Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={15} />
              <span>Search</span>
            </button>
          </form>

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
                <option value="APPROVED">Approved</option>
                <option value="REVIEW">Review</option>
                <option value="BLOCKED">Blocked</option>
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
                <option value="ALL">All Risks</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={fetchTransactions}
              title="Refresh transaction list"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileSpreadsheet size={20} color="#2563eb" />
            <span>Master Transaction Repository ({transactions.length})</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading transactions...
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            isAdmin={true}
            onViewDetails={(txn) => setSelectedTxn(txn)}
            onApprove={handleApprove}
            onBlock={handleBlock}
          />
        )}
      </div>

      {/* Inspection Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`Transaction Audit – ${selectedTxn.transactionId}`}
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
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Sender (Customer)</div>
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
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Device ID</div>
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
                🚨 Suspicious Indicators Detected:
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.82rem', color: '#7f1d1d' }}>
                {selectedTxn.suspiciousReasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

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

      {/* Confirmation Dialog */}
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

export default AdminTransactions;
