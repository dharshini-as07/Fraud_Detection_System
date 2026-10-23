import React from 'react';
import RiskBadge from './RiskBadge';
import { Eye, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

const TransactionTable = ({
  transactions = [],
  isAdmin = false,
  onViewDetails,
  onApprove,
  onBlock
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <ArrowUpRight size={40} className="empty-state-icon" />
        <p style={{ fontWeight: 600, color: '#475569' }}>No transactions found</p>
        <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
          Transactions matching the criteria will appear here.
        </p>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'badge-status badge-approved';
      case 'REVIEW':
        return 'badge-status badge-review';
      case 'BLOCKED':
        return 'badge-status badge-blocked';
      default:
        return 'badge-status badge-pending';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Date & Time</th>
            {isAdmin ? <th>Customer (Sender)</th> : <th>Receiver / Beneficiary</th>}
            <th>Amount</th>
            {isAdmin && <th>Risk Evaluation</th>}
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn._id || txn.transactionId}>
              <td>
                <span className="table-code">{txn.transactionId}</span>
              </td>
              <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {formatDate(txn.timestamp || txn.createdAt)}
              </td>
              <td>
                {isAdmin ? (
                  <div>
                    <div style={{ fontWeight: 600 }}>{txn.sender}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      To: {txn.receiver}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600 }}>{txn.receiver}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {txn.beneficiary}
                    </div>
                  </div>
                )}
              </td>
              <td>
                <span className="table-amount">₹{Number(txn.amount).toLocaleString('en-IN')}</span>
              </td>
              {isAdmin && (
                <td>
                  <RiskBadge level={txn.riskLevel} score={txn.riskScore} />
                </td>
              )}
              <td>
                <span className={getStatusBadgeClass(txn.status)}>{txn.status}</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onViewDetails(txn)}
                    title="View Transaction Details"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  {isAdmin && txn.status !== 'APPROVED' && onApprove && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => onApprove(txn)}
                      title="Approve Transaction"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve</span>
                    </button>
                  )}

                  {isAdmin && txn.status !== 'BLOCKED' && onBlock && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onBlock(txn)}
                      title="Block Transaction"
                    >
                      <XCircle size={14} />
                      <span>Block</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
