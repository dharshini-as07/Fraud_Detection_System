import React, { useState, useEffect } from 'react';
import API from '../services/api';
import TransactionTable from '../components/TransactionTable';
import Modal from '../components/Modal';
import { Search, Filter, RefreshCw, History } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions', {
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
      console.error('Error fetching transactions:', err);
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

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by Transaction ID, Receiver, Location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={15} />
              <span>Search</span>
            </button>
          </form>

          {/* Filter Dropdowns */}
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
            <History size={20} color="#2563eb" />
            <span>Transaction Records ({transactions.length})</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading records...
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            isAdmin={false}
            onViewDetails={(txn) => setSelectedTxn(txn)}
          />
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title={`Transaction Report – ${selectedTxn.transactionId}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '9999px',
                background: selectedTxn.status === 'APPROVED' ? '#ecfdf5' : selectedTxn.status === 'REVIEW' ? '#fffbeb' : '#fef2f2',
                color: selectedTxn.status === 'APPROVED' ? '#065f46' : selectedTxn.status === 'REVIEW' ? '#92400e' : '#991b1b'
              }}
            >
              Status: {selectedTxn.status === 'APPROVED' ? 'Completed' : selectedTxn.status === 'REVIEW' ? 'Under Review' : 'Failed'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              UPI Ref: {selectedTxn.transactionId}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Amount</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                ₹{Number(selectedTxn.amount).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Receiver</div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{selectedTxn.receiver}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Beneficiary Account</div>
              <div style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{selectedTxn.beneficiary}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Debited From</div>
              <div style={{ fontSize: '0.85rem' }}>State Bank of India (•••• 1001)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Location</div>
              <div style={{ fontSize: '0.9rem' }}>{selectedTxn.location}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Date Processed</div>
              <div style={{ fontSize: '0.85rem' }}>{new Date(selectedTxn.timestamp || selectedTxn.createdAt).toLocaleString()}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Transactions;
