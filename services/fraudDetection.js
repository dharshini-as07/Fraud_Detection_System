/**
 * Rule-Based Fraud Detection Engine
 * 
 * Evaluates financial transactions against 5 deterministic risk rules.
 * No machine learning or AI models are used.
 * Produces a normalized risk score (0 - 100), risk level (LOW, MEDIUM, HIGH),
 * and an array of suspicious reasons explaining why rules triggered.
 */

/**
 * Calculates fraud risk score and determines risk classification.
 * 
 * @param {Object} transaction - Current transaction payload
 * @param {Array} userHistory - List of past transactions for this user
 * @returns {Object} { riskScore, riskLevel, status, suspiciousReasons, ruleBreakdown }
 */
function calculateRisk(transaction, userHistory = []) {
  let riskScore = 0;
  const suspiciousReasons = [];
  const ruleBreakdown = [];

  const amount = Number(transaction.amount);
  const currentTimestamp = transaction.timestamp ? new Date(transaction.timestamp) : new Date();

  // -------------------------------------------------------------
  // RULE 1 – UNUSUAL TRANSACTION AMOUNT (+25 Points)
  // -------------------------------------------------------------
  let rule1Triggered = false;
  let rule1Reason = '';

  if (userHistory.length > 0) {
    const totalPrevious = userHistory.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const avgAmount = totalPrevious / userHistory.length;

    // Trigger if transaction is more than 3x the user's historical average,
    // or if it exceeds 2x average and is at least 30,000
    if (amount > avgAmount * 3 || (amount > avgAmount * 2 && amount >= 30000)) {
      rule1Triggered = true;
      rule1Reason = `Unusual transaction amount: ₹${amount.toLocaleString()} is significantly higher than user average (₹${Math.round(avgAmount).toLocaleString()})`;
    }
  } else {
    // New user with no history: flag if first transaction is unusually large
    if (amount >= 50000) {
      rule1Triggered = true;
      rule1Reason = `High initial transfer: First transaction of ₹${amount.toLocaleString()} exceeds normal baseline`;
    }
  }

  if (rule1Triggered) {
    riskScore += 25;
    suspiciousReasons.push(rule1Reason);
  }
  ruleBreakdown.push({
    rule: 'RULE 1: Unusual Transaction Amount',
    points: 25,
    triggered: rule1Triggered,
    reason: rule1Reason || 'Amount is consistent with user spending pattern'
  });

  // -------------------------------------------------------------
  // RULE 2 – RAPID REPEATED TRANSACTIONS (+20 Points)
  // -------------------------------------------------------------
  let rule2Triggered = false;
  let rule2Reason = '';

  if (userHistory.length > 0) {
    const fiveMinutesAgo = new Date(currentTimestamp.getTime() - 5 * 60 * 1000);
    const twoMinutesAgo = new Date(currentTimestamp.getTime() - 2 * 60 * 1000);

    const txnsInLast5Mins = userHistory.filter(t => {
      const txTime = new Date(t.timestamp || t.createdAt);
      return txTime >= fiveMinutesAgo && txTime <= currentTimestamp;
    });

    const txnsInLast2Mins = userHistory.filter(t => {
      const txTime = new Date(t.timestamp || t.createdAt);
      return txTime >= twoMinutesAgo && txTime <= currentTimestamp;
    });

    // Trigger if >= 2 transactions in last 5 mins OR >= 1 in last 2 mins
    if (txnsInLast2Mins.length >= 1 || txnsInLast5Mins.length >= 2) {
      rule2Triggered = true;
      const count = txnsInLast5Mins.length + 1;
      rule2Reason = `Rapid repeated transactions: ${count} transactions detected within a 5-minute window`;
    }
  }

  if (rule2Triggered) {
    riskScore += 20;
    suspiciousReasons.push(rule2Reason);
  }
  ruleBreakdown.push({
    rule: 'RULE 2: Rapid Repeated Transactions',
    points: 20,
    triggered: rule2Triggered,
    reason: rule2Reason || 'Transaction frequency is within normal velocity limits'
  });

  // -------------------------------------------------------------
  // RULE 3 – NEW BENEFICIARY (+20 Points)
  // -------------------------------------------------------------
  let rule3Triggered = false;
  let rule3Reason = '';

  if (userHistory.length > 0) {
    const pastBeneficiaries = new Set(
      userHistory.map(t => (t.beneficiary || '').trim().toLowerCase()).filter(Boolean)
    );
    const pastReceivers = new Set(
      userHistory.map(t => (t.receiver || '').trim().toLowerCase()).filter(Boolean)
    );

    const currentBeneficiary = (transaction.beneficiary || '').trim().toLowerCase();
    const currentReceiver = (transaction.receiver || '').trim().toLowerCase();

    const isExistingBeneficiary = pastBeneficiaries.has(currentBeneficiary) || pastReceivers.has(currentReceiver);

    if (!isExistingBeneficiary) {
      rule3Triggered = true;
      rule3Reason = `New beneficiary: First-time transfer to receiver '${transaction.receiver}' (${transaction.beneficiary})`;
    }
  }

  if (rule3Triggered) {
    riskScore += 20;
    suspiciousReasons.push(rule3Reason);
  }
  ruleBreakdown.push({
    rule: 'RULE 3: New Beneficiary',
    points: 20,
    triggered: rule3Triggered,
    reason: rule3Reason || 'Beneficiary is verified in user transaction history'
  });

  // -------------------------------------------------------------
  // RULE 4 – NEW DEVICE (+15 Points)
  // -------------------------------------------------------------
  let rule4Triggered = false;
  let rule4Reason = '';

  if (userHistory.length > 0) {
    const pastDevices = new Set(
      userHistory.map(t => (t.deviceId || '').trim().toLowerCase()).filter(Boolean)
    );
    const currentDevice = (transaction.deviceId || '').trim().toLowerCase();

    if (currentDevice && !pastDevices.has(currentDevice)) {
      rule4Triggered = true;
      rule4Reason = `Unrecognized device: Transaction initiated from unverified device (${transaction.deviceId})`;
    }
  }

  if (rule4Triggered) {
    riskScore += 15;
    suspiciousReasons.push(rule4Reason);
  }
  ruleBreakdown.push({
    rule: 'RULE 4: New Device',
    points: 15,
    triggered: rule4Triggered,
    reason: rule4Reason || 'Device matches previously recognized device fingerprint'
  });

  // -------------------------------------------------------------
  // RULE 5 – UNUSUAL LOCATION (+10 Points)
  // -------------------------------------------------------------
  let rule5Triggered = false;
  let rule5Reason = '';

  if (userHistory.length > 0) {
    // Look at last 10 transaction locations
    const recentLocations = userHistory
      .slice(0, 10)
      .map(t => (t.location || '').trim().toLowerCase())
      .filter(Boolean);

    const currentLocation = (transaction.location || '').trim().toLowerCase();

    if (currentLocation && recentLocations.length > 0 && !recentLocations.includes(currentLocation)) {
      rule5Triggered = true;
      rule5Reason = `Unusual location: Transaction initiated from '${transaction.location}', differing from recent geographic profile`;
    }
  }

  if (rule5Triggered) {
    riskScore += 10;
    suspiciousReasons.push(rule5Reason);
  }
  ruleBreakdown.push({
    rule: 'RULE 5: Unusual Location',
    points: 10,
    triggered: rule5Triggered,
    reason: rule5Reason || 'Geographic location matches familiar user locations'
  });

  // -------------------------------------------------------------
  // NORMALIZE RISK SCORE (Max 100) & CLASSIFY
  // -------------------------------------------------------------
  const finalRiskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel = 'LOW';
  let status = 'APPROVED';

  if (finalRiskScore >= 71) {
    riskLevel = 'HIGH';
    status = 'BLOCKED'; // System design: high risk is auto-blocked pending admin investigation
  } else if (finalRiskScore >= 31) {
    riskLevel = 'MEDIUM';
    status = 'REVIEW';  // Medium risk is held for manual admin review
  } else {
    riskLevel = 'LOW';
    status = 'APPROVED'; // Low risk is automatically approved
  }

  return {
    riskScore: finalRiskScore,
    riskLevel,
    status,
    suspiciousReasons,
    ruleBreakdown
  };
}

module.exports = {
  calculateRisk
};
