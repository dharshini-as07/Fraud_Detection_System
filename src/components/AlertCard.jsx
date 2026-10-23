import React from 'react';
import RiskBadge from './RiskBadge';
import { AlertCircle, Clock, Check, Eye } from 'lucide-react';

const AlertCard = ({ alert, onReview, onViewTxn }) => {
  const isHigh = alert.riskLevel === 'HIGH';

  const cardBorderColor = isHigh ? '#fca5a5' : '#fcd34d';
  const cardBgColor = isHigh ? '#fff5f5' : '#fffdfa';

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      style={{
        border: `1px solid ${cardBorderColor}`,
        backgroundColor: cardBgColor,
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '14px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RiskBadge level={alert.riskLevel} score={alert.riskScore} />
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
            {alert.transactionId}
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: alert.status === 'NEW' ? '#ef4444' : alert.status === 'REVIEWED' ? '#f59e0b' : '#10b981',
              color: '#ffffff'
            }}
          >
            {alert.status}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
          <Clock size={13} />
          <span>{formatTimeAgo(alert.createdAt)}</span>
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0f172a', marginBottom: '8px' }}>
        {alert.message}
      </div>

      {alert.userId && typeof alert.userId === 'object' && (
        <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '10px' }}>
          Customer: <strong>{alert.userId.name}</strong> ({alert.userId.email} | {alert.userId.phone})
        </div>
      )}

      {alert.reasons && alert.reasons.length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
            Triggered Fraud Rules:
          </div>
          <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
            {alert.reasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: isHigh ? '#991b1b' : '#92400e',
                  marginBottom: '4px'
                }}
              >
                <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
        {onViewTxn && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onViewTxn(alert.transactionId)}
          >
            <Eye size={13} />
            <span>Investigate</span>
          </button>
        )}

        {onReview && alert.status !== 'RESOLVED' && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onReview(alert._id, 'RESOLVED')}
          >
            <Check size={13} />
            <span>Mark Resolved</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
