import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const RiskBadge = ({ level = 'LOW', score = null, showScore = true }) => {
  const normalizedLevel = (level || 'LOW').toUpperCase();

  let badgeClass = 'badge badge-low';
  let Icon = ShieldCheck;

  if (normalizedLevel === 'HIGH') {
    badgeClass = 'badge badge-high';
    Icon = ShieldAlert;
  } else if (normalizedLevel === 'MEDIUM') {
    badgeClass = 'badge badge-medium';
    Icon = AlertTriangle;
  }

  return (
    <span className={badgeClass}>
      <Icon size={13} strokeWidth={2.5} />
      <span>{normalizedLevel}</span>
      {showScore && score !== null && (
        <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({score} pts)</span>
      )}
    </span>
  );
};

export default RiskBadge;
