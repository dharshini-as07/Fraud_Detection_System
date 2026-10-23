import React from 'react';

const SummaryCard = ({ title, value, subtitle, icon, variant = 'primary' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${variant}`}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-value">{value !== undefined ? value : 0}</span>
        <span className="stat-label">{title}</span>
        {subtitle && (
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
