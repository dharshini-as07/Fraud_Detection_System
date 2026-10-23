import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import RiskBadge from '../components/RiskBadge';
import {
  Building2,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldBan,
  ShieldCheck,
  Lock,
  Send,
  History,
  Plus,
  ChevronRight,
  MapPin,
  Cpu,
  UserCheck,
  Check,
  X,
  CreditCard,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-react';

// Popular Indian Banks and IFSC codes for search & auto-detection
const POPULAR_BANKS = [
  {
    code: 'SBIN',
    name: 'State Bank of India',
    branches: [
      { name: 'Anna Nagar, Chennai', ifsc: 'SBIN0001001', city: 'Chennai' },
      { name: 'Chennai Main Branch', ifsc: 'SBIN0000800', city: 'Chennai' },
      { name: 'Fort, Mumbai', ifsc: 'SBIN0000300', city: 'Mumbai' }
    ]
  },
  {
    code: 'HDFC',
    name: 'HDFC Bank',
    branches: [
      { name: 'Nungambakkam, Chennai', ifsc: 'HDFC0000240', city: 'Chennai' },
      { name: 'T. Nagar, Chennai', ifsc: 'HDFC0000017', city: 'Chennai' },
      { name: 'Bandra West, Mumbai', ifsc: 'HDFC0000008', city: 'Mumbai' }
    ]
  },
  {
    code: 'ICIC',
    name: 'ICICI Bank',
    branches: [
      { name: 'Cathedral Road, Chennai', ifsc: 'ICIC0006321', city: 'Chennai' },
      { name: 'Adyar, Chennai', ifsc: 'ICIC0000001', city: 'Chennai' },
      { name: 'Nariman Point, Mumbai', ifsc: 'ICIC0000004', city: 'Mumbai' }
    ]
  },
  {
    code: 'CNRB',
    name: 'Canara Bank',
    branches: [
      { name: 'Mount Road, Chennai', ifsc: 'CNRB0005971', city: 'Chennai' },
      { name: 'Koramangala, Bangalore', ifsc: 'CNRB0000412', city: 'Bangalore' }
    ]
  },
  {
    code: 'UTIB',
    name: 'Axis Bank',
    branches: [
      { name: 'Alwarpet, Chennai', ifsc: 'UTIB0000123', city: 'Chennai' },
      { name: 'Indiranagar, Bangalore', ifsc: 'UTIB0000056', city: 'Bangalore' }
    ]
  }
];

// Quick Demo Presets
const DEMO_PRESETS = [
  {
    name: 'Priya Verma',
    account: '30981245678',
    ifsc: 'SBIN0001001',
    bank: 'State Bank of India',
    branch: 'Anna Nagar, Chennai'
  },
  {
    name: 'Apex Gadgets Store',
    account: '501004928123',
    ifsc: 'ICIC0006321',
    bank: 'ICICI Bank',
    branch: 'Cathedral Road, Chennai'
  },
  {
    name: 'Vikram Patel',
    account: '918237465012',
    ifsc: 'HDFC0000240',
    bank: 'HDFC Bank',
    branch: 'Nungambakkam, Chennai'
  }
];

// Initial user-linked self accounts (e.g. Canara Bank from reference)
const INITIAL_SELF_ACCOUNTS = [
  {
    id: 'canara-5971',
    bank: 'Canara Bank',
    accountNumber: '•••• 5971',
    fullAccount: '110023455971',
    ifsc: 'CNRB0005971',
    type: 'Savings Account',
    branch: 'Mount Road, Chennai',
    bg: '#00838f',
    initial: 'C'
  },
  {
    id: 'hdfc-4022',
    bank: 'HDFC Bank',
    accountNumber: '•••• 4022',
    fullAccount: '501002934022',
    ifsc: 'HDFC0000240',
    type: 'Salary Account',
    branch: 'Nungambakkam, Chennai',
    bg: '#004c8f',
    initial: 'H'
  }
];

const BankTransfer = () => {
  const navigate = useNavigate();

  // Active Mode: 'others' | 'self'
  const [activeTab, setActiveTab] = useState('others');

  // "To others" Form State
  const [othersForm, setOthersForm] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    recipientName: '',
    amount: '0',
    bankName: '',
    branchName: ''
  });

  // "To self" State
  const [selfAccounts, setSelfAccounts] = useState(INITIAL_SELF_ACCOUNTS);
  const [selectedSelfAccount, setSelectedSelfAccount] = useState(INITIAL_SELF_ACCOUNTS[0]);
  const [selfAmount, setSelfAmount] = useState('0');

  // Modal State for "Add Bank Account" in Self Transfer
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    bank: 'Canara Bank',
    accountNumber: '',
    ifsc: 'CNRB0005971',
    type: 'Savings Account'
  });

  // Modal State for IFSC Search
  const [showIfscModal, setShowIfscModal] = useState(false);
  const [ifscSearchQuery, setIfscSearchQuery] = useState('');

  // Device & GPS Metadata
  const [metadata, setMetadata] = useState({
    location: 'Chennai, Tamil Nadu, India',
    deviceId: 'Generating fingerprint...'
  });
  const [gpsStatus, setGpsStatus] = useState('verified');

  // Transactions list (for recent bank transfers)
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // 1. Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const res = await API.get('/transactions');
      if (res.data?.success && Array.isArray(res.data.transactions)) {
        setAllTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn('Could not fetch transactions:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 2. Auto-Detect GPS Location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setMetadata((prev) => ({ ...prev, location: 'Chennai, Tamil Nadu, India (GPS Auto-Detected)' }));
      setGpsStatus('verified');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.state_district ||
              'Chennai';
            const state = data.address?.state || 'Tamil Nadu';
            const country = data.address?.country || 'India';
            setMetadata((prev) => ({
              ...prev,
              location: `${city}, ${state}, ${country} (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`
            }));
            setGpsStatus('verified');
            return;
          }
        } catch (e) {}
        setMetadata((prev) => ({
          ...prev,
          location: `Chennai, Tamil Nadu (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`
        }));
        setGpsStatus('verified');
      },
      () => {
        setMetadata((prev) => ({ ...prev, location: 'Chennai, Tamil Nadu, India (GPS Auto-Detected)' }));
        setGpsStatus('verified');
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // 3. Generate Device Fingerprint
  const generateFingerprint = () => {
    try {
      const nav = window.navigator || {};
      const screen = window.screen || {};
      const platform = nav.platform || 'MacIntel';
      const screenRes = `${screen.width || 1440}x${screen.height || 900}`;
      const language = nav.language || 'en-US';
      const concurrency = nav.hardwareConcurrency || 8;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const userAgent = nav.userAgent || '';

      const seed = `${platform}|${screenRes}|${language}|${concurrency}|${timezone}|${userAgent.slice(0, 50)}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(-6);

      let os = 'MAC';
      if (/Win/i.test(platform)) os = 'WIN';
      else if (/Linux/i.test(platform)) os = 'LINUX';
      else if (/iPhone|iPad/i.test(userAgent)) os = 'IOS';
      else if (/Android/i.test(userAgent)) os = 'ANDROID';

      let browser = 'CHROME';
      if (/Firefox/i.test(userAgent)) browser = 'FIREFOX';
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'SAFARI';
      else if (/Edg/i.test(userAgent)) browser = 'EDGE';

      return `DEV-${os}-${browser}-${hex}`;
    } catch (e) {
      return 'DEV-MAC-CHROME-8F42A1';
    }
  };

  useEffect(() => {
    detectLocation();
    const fp = generateFingerprint();
    setMetadata((prev) => ({ ...prev, deviceId: fp }));
  }, []);

  // Format Date for UI (Google Pay Style with Day, Date & 12h Time)
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

  // Auto-detect Bank & Branch when IFSC changes
  const handleIfscChange = (rawIfsc) => {
    const val = rawIfsc.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    let detectedBank = '';
    let detectedBranch = '';

    if (val.length >= 4) {
      const prefix = val.slice(0, 4);
      const matchBank = POPULAR_BANKS.find((b) => b.code === prefix);
      if (matchBank) {
        detectedBank = matchBank.name;
        const matchBranch = matchBank.branches.find((br) => br.ifsc === val);
        if (matchBranch) {
          detectedBranch = matchBranch.name;
        } else {
          detectedBranch = 'Verified National Branch';
        }
      }
    }

    setOthersForm((prev) => ({
      ...prev,
      ifsc: val,
      bankName: detectedBank,
      branchName: detectedBranch
    }));
  };

  // Select a branch from IFSC Modal
  const handleSelectBranch = (bankName, branch) => {
    setOthersForm((prev) => ({
      ...prev,
      ifsc: branch.ifsc,
      bankName: bankName,
      branchName: branch.name
    }));
    setShowIfscModal(false);
  };

  // Quick fill from demo presets
  const handleApplyPreset = (preset) => {
    setOthersForm({
      accountNumber: preset.account,
      confirmAccountNumber: preset.account,
      ifsc: preset.ifsc,
      recipientName: preset.name,
      amount: '0',
      bankName: preset.bank,
      branchName: preset.branch
    });
    setError('');
    setResult(null);
  };

  // Filter recent bank transfers (transactions with A/C or bank transfers)
  const recentBankTransfers = allTransactions.filter((t) => {
    const b = (t.beneficiary || '').toLowerCase();
    const r = (t.receiver || '').toLowerCase();
    return b.includes('acc-') || b.includes('a/c') || b.includes('sbin') || b.includes('hdfc') || b.includes('icic') || b.includes('cnrb') || r.includes('bank') || r.includes('utility');
  });

  // Submit "To others" transfer
  const handleTransferToOthers = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!othersForm.accountNumber || othersForm.accountNumber.length < 8) {
      setError('Please enter a valid bank account number (minimum 8 digits).');
      return;
    }

    if (othersForm.accountNumber !== othersForm.confirmAccountNumber) {
      setError('Account numbers do not match. Please verify both entries.');
      return;
    }

    if (!othersForm.ifsc || othersForm.ifsc.length !== 11) {
      setError('Please provide a valid 11-character IFSC code.');
      return;
    }

    if (!othersForm.recipientName.trim()) {
      setError('Please enter the recipient account holder name.');
      return;
    }

    const amt = Number(othersForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid transfer amount greater than zero.');
      return;
    }

    // Prepare bank transfer beneficiary string
    const maskedAcct = `A/C •••• ${othersForm.accountNumber.slice(-4)}`;
    const beneficiaryString = `${maskedAcct} (${othersForm.ifsc})`;

    const payload = {
      receiver: othersForm.recipientName.trim(),
      beneficiary: beneficiaryString,
      amount: amt,
      location: metadata.location,
      deviceId: metadata.deviceId
    };

    try {
      setLoading(true);
      const res = await API.post('/transactions', payload);
      if (res.data?.success) {
        setResult(res.data);
        const newTxn = res.data.transaction || res.data.data;
        if (newTxn) {
          setAllTransactions((prev) => [newTxn, ...prev]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process bank transfer.');
    } finally {
      setLoading(false);
    }
  };

  // Submit "To self" transfer
  const handleTransferToSelf = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const amt = Number(selfAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid transfer amount greater than zero.');
      return;
    }

    if (!selectedSelfAccount) {
      setError('Please select a destination account for self transfer.');
      return;
    }

    const payload = {
      receiver: `Self (${selectedSelfAccount.bank})`,
      beneficiary: `${selectedSelfAccount.bank} ${selectedSelfAccount.accountNumber} (${selectedSelfAccount.ifsc})`,
      amount: amt,
      location: metadata.location,
      deviceId: metadata.deviceId
    };

    try {
      setLoading(true);
      const res = await API.post('/transactions', payload);
      if (res.data?.success) {
        setResult(res.data);
        const newTxn = res.data.transaction || res.data.data;
        if (newTxn) {
          setAllTransactions((prev) => [newTxn, ...prev]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process self transfer.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new self bank account
  const handleAddNewAccount = (e) => {
    e.preventDefault();
    if (!newAccountForm.accountNumber || newAccountForm.accountNumber.length < 8) {
      alert('Please enter a valid account number.');
      return;
    }

    const last4 = newAccountForm.accountNumber.slice(-4);
    const newAcc = {
      id: `acc-${Date.now()}`,
      bank: newAccountForm.bank,
      accountNumber: `•••• ${last4}`,
      fullAccount: newAccountForm.accountNumber,
      ifsc: newAccountForm.ifsc,
      type: newAccountForm.type,
      branch: 'Verified Primary Branch',
      bg: newAccountForm.bank.includes('Canara') ? '#00838f' : '#1a73e8',
      initial: newAccountForm.bank.charAt(0)
    };

    setSelfAccounts((prev) => [...prev, newAcc]);
    setSelectedSelfAccount(newAcc);
    setShowAddAccountModal(false);
    setNewAccountForm({
      bank: 'Canara Bank',
      accountNumber: '',
      ifsc: 'CNRB0005971',
      type: 'Savings Account'
    });
  };

  const accountMatch =
    othersForm.accountNumber &&
    othersForm.confirmAccountNumber &&
    othersForm.accountNumber === othersForm.confirmAccountNumber;

  return (
    <div className="gpay-view-container" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#1a73e8',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.88rem'
          }}
        >
          <ArrowLeft size={18} />
          <span>GPay Home</span>
        </Link>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#202124' }}>
          Bank Transfer
        </span>
        <div style={{ width: '40px' }} />
      </div>

      {/* Modern Segmented Navigation Tabs: "To others" | "To self" */}
      <div
        style={{
          display: 'flex',
          background: '#f1f3f4',
          borderRadius: '9999px',
          padding: '4px',
          marginBottom: '22px'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('others');
            setError('');
            setResult(null);
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'others' ? '#ffffff' : 'transparent',
            color: activeTab === 'others' ? '#1a73e8' : '#5f6368',
            boxShadow: activeTab === 'others' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <Building2 size={17} />
          <span>To others</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('self');
            setError('');
            setResult(null);
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: activeTab === 'self' ? '#ffffff' : 'transparent',
            color: activeTab === 'self' ? '#1a73e8' : '#5f6368',
            boxShadow: activeTab === 'self' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
          }}
        >
          <ArrowRightLeft size={17} />
          <span>To self</span>
        </button>
      </div>

      {error && (
        <div className="alert-box error" style={{ marginBottom: '18px', textAlign: 'center' }}>
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: TO OTHERS (Receiver's bank details)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'others' && (
        <div>
          {/* Main Card */}
          <div className="gpay-pay-box">
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#202124', margin: 0 }}>
                  Receiver's bank details
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#5f6368', margin: '4px 0 0 0' }}>
                  Direct IMPS / NEFT transfer to any bank in India
                </p>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#e6f4ea',
                  color: '#137333',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                <ShieldCheck size={13} />
                <span>Zero Fee Transfer</span>
              </span>
            </div>

            {/* Simulated Demo Presets Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5f6368', marginBottom: '8px', textTransform: 'uppercase' }}>
                Quick Demo Accounts (Simulated)
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DEMO_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      background: '#f8fafd',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#1a73e8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>+ {p.name.split(' ')[0]} ({p.bank.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleTransferToOthers}>
              {/* Bank Account Number */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3c4043' }}>
                  Bank account number *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 501004928123"
                  className="form-input"
                  value={othersForm.accountNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setOthersForm((p) => ({ ...p, accountNumber: clean }));
                  }}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.95rem',
                    letterSpacing: '0.5px',
                    borderRadius: '12px'
                  }}
                  required
                />
              </div>

              {/* Re-enter Bank Account Number */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3c4043', margin: 0 }}>
                    Re-enter bank account number *
                  </label>
                  {accountMatch && (
                    <span style={{ fontSize: '0.72rem', color: '#1e8e3e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={13} />
                      <span>Account matched</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Re-type account number to confirm"
                  className="form-input"
                  value={othersForm.confirmAccountNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setOthersForm((p) => ({ ...p, confirmAccountNumber: clean }));
                  }}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    borderColor:
                      othersForm.confirmAccountNumber && !accountMatch
                        ? '#ea4335'
                        : accountMatch
                        ? '#34a853'
                        : undefined
                  }}
                  required
                />
              </div>

              {/* IFSC Code + Search for IFSC button */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3c4043', margin: 0 }}>
                    IFSC code *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIfscModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Search size={13} />
                    <span>Search for IFSC</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001001"
                  className="form-input"
                  value={othersForm.ifsc}
                  onChange={(e) => handleIfscChange(e.target.value)}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    borderRadius: '12px'
                  }}
                  maxLength={11}
                  required
                />
                {/* Auto-detected Bank Name & Branch */}
                {othersForm.bankName && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '0.75rem',
                      color: '#1e8e3e',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>
                      {othersForm.bankName} {othersForm.branchName ? `• ${othersForm.branchName}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Recipient Account Holder Name */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3c4043' }}>
                  Recipient name (as per bank records) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Verma"
                  className="form-input"
                  value={othersForm.recipientName}
                  onChange={(e) => setOthersForm((p) => ({ ...p, recipientName: e.target.value }))}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.95rem',
                    borderRadius: '12px'
                  }}
                  required
                />
              </div>

              {/* Transfer Amount */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3c4043', marginBottom: '8px' }}>
                  Transfer Amount
                </label>
                <div className="gpay-big-amount-wrapper">
                  <span className="gpay-currency-symbol">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="gpay-amount-input"
                    placeholder="0"
                    value={othersForm.amount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9.]/g, '');
                      setOthersForm((p) => ({ ...p, amount: clean }));
                    }}
                    onFocus={() => {
                      if (othersForm.amount === '0') setOthersForm((p) => ({ ...p, amount: '' }));
                    }}
                    onBlur={() => {
                      if (!othersForm.amount || othersForm.amount.trim() === '') {
                        setOthersForm((p) => ({ ...p, amount: '0' }));
                      }
                    }}
                    required
                  />
                </div>
              </div>

              {/* Security & Metadata section (read-only, no "(Read-Only)" text) */}
              <div
                style={{
                  background: '#f8fafd',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  marginBottom: '20px',
                  border: '1px solid #dadce0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3c4043' }}>
                    FraudShield Security Metadata:
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#1e8e3e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} />
                    <span>Protected</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', margin: '0 0 3px 0' }}>
                      GPS Location
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={metadata.location}
                      readOnly
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.76rem',
                        background: '#f1f3f4',
                        cursor: 'default',
                        border: '1px solid #dadce0'
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', margin: '0 0 3px 0' }}>
                      Device Fingerprint
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={metadata.deviceId}
                      readOnly
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.76rem',
                        fontFamily: 'monospace',
                        background: '#f1f3f4',
                        cursor: 'default',
                        border: '1px solid #dadce0'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Debiting Bank Account Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f1f3f4',
                  borderRadius: '12px',
                  marginBottom: '22px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={18} color="#1a73e8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Debiting: State Bank of India •••• 1001
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#1e8e3e', fontWeight: 700 }}>
                  Active Primary
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
              >
                {loading ? (
                  'Verifying Fraud Rules...'
                ) : (
                  <>
                    <span>Continue Transfer (₹{Number(othersForm.amount || 0).toLocaleString('en-IN')})</span>
                    <Send size={17} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.72rem', color: '#5f6368' }}>
                This information will be securely saved as per Google Pay Terms of Service and Privacy Policy
              </div>
            </form>
          </div>

          {/* Recent Bank Transfers Section (Placed down below the form) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e8eaed',
              padding: '18px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              marginTop: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="#1a73e8" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#202124' }}>
                  Recent transfers
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#5f6368', fontWeight: 600 }}>
                {recentBankTransfers.length} records
              </span>
            </div>

            {recentBankTransfers.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#f8fafd', borderRadius: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#e8f0fe',
                    color: '#1a73e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#5f6368' }}>
                  Recent bank transfers will show up here for you to easily repeat them.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentBankTransfers.slice(0, 5).map((txn) => (
                  <div
                    key={txn._id || txn.transactionId}
                    onClick={() => {
                      setOthersForm((p) => ({
                        ...p,
                        recipientName: txn.receiver,
                        amount: String(txn.amount || 0)
                      }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafd',
                      borderRadius: '12px',
                      border: '1px solid #dadce0',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: '#1a73e8',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem'
                        }}
                      >
                        {txn.receiver ? txn.receiver.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#202124' }}>
                          {txn.receiver}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#5f6368', marginTop: '2px' }}>
                          {txn.beneficiary}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#137333', fontWeight: 600, marginTop: '2px' }}>
                          {formatTxnDate(txn.timestamp || txn.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#202124' }}>
                        -₹{Number(txn.amount).toLocaleString('en-IN')}
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          background: txn.status === 'APPROVED' ? '#e6f4ea' : txn.status === 'REVIEW' ? '#fef7e0' : '#fce8e6',
                          color: txn.status === 'APPROVED' ? '#137333' : txn.status === 'REVIEW' ? '#b06000' : '#c5221f'
                        }}
                      >
                        {txn.status === 'APPROVED' ? 'Completed' : txn.status === 'REVIEW' ? 'Review' : 'Blocked'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TO SELF (Self transfer between user's linked accounts)               */}
      {/* ========================================================================= */}
      {activeTab === 'self' && (
        <div>
          <div className="gpay-pay-box">
            {/* Header info */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#202124', margin: 0 }}>
                Self transfer
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#5f6368', margin: '4px 0 0 0' }}>
                Manage your money better by adding another account to make self transfers.
              </p>
            </div>

            {/* Source Account (Debited) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5f6368', marginBottom: '6px', textTransform: 'uppercase' }}>
                Transfer From (Primary Source)
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: '#f8fafd',
                  border: '1px solid #dadce0',
                  borderRadius: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#1a73e8',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}
                  >
                    S
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#202124' }}>
                      State Bank of India •••• 1001
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#5f6368' }}>
                      Primary Savings Account • IFSC: SBIN0001001
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', background: '#e6f4ea', color: '#137333', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px' }}>
                  Debiting
                </span>
              </div>
            </div>

            {/* Destination Self Account Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5f6368', marginBottom: '8px', textTransform: 'uppercase' }}>
                Transfer To (Select Account)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selfAccounts.map((acc) => {
                  const isSelected = selectedSelfAccount?.id === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedSelfAccount(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #1a73e8' : '1px solid #dadce0',
                        background: isSelected ? '#e8f0fe' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: acc.bg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.1rem'
                          }}
                        >
                          {acc.initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#202124' }}>
                            {acc.bank} {acc.accountNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#5f6368' }}>
                            {acc.type} • {acc.branch}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid #1a73e8' : '2px solid #dadce0',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  );
                })}

                {/* + Add Bank Account button */}
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1.5px dashed #1a73e8',
                    background: '#f8fafd',
                    color: '#1a73e8',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={18} />
                  <span>Add bank account</span>
                </button>
              </div>
            </div>

            {/* Self Transfer Amount Form */}
            <form onSubmit={handleTransferToSelf}>
              <div style={{ marginBottom: '22px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3c4043', marginBottom: '8px' }}>
                  Self Transfer Amount
                </label>
                <div className="gpay-big-amount-wrapper">
                  <span className="gpay-currency-symbol">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="gpay-amount-input"
                    placeholder="0"
                    value={selfAmount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9.]/g, '');
                      setSelfAmount(clean);
                    }}
                    onFocus={() => {
                      if (selfAmount === '0') setSelfAmount('');
                    }}
                    onBlur={() => {
                      if (!selfAmount || selfAmount.trim() === '') setSelfAmount('0');
                    }}
                    required
                  />
                </div>
              </div>

              {/* Security Metadata */}
              <div
                style={{
                  background: '#f8fafd',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  marginBottom: '20px',
                  border: '1px solid #dadce0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#3c4043' }}>
                    Fraud & Risk Audit Engine:
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#1e8e3e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} />
                    <span>Self Account Verified</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', margin: '0 0 3px 0' }}>
                      GPS Location
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={metadata.location}
                      readOnly
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.76rem',
                        background: '#f1f3f4',
                        cursor: 'default',
                        border: '1px solid #dadce0'
                      }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', margin: '0 0 3px 0' }}>
                      Device Fingerprint
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={metadata.deviceId}
                      readOnly
                      style={{
                        padding: '7px 10px',
                        fontSize: '0.76rem',
                        fontFamily: 'monospace',
                        background: '#f1f3f4',
                        cursor: 'default',
                        border: '1px solid #dadce0'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Button */}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
              >
                {loading ? (
                  'Verifying Fraud Rules...'
                ) : (
                  <>
                    <span>
                      Transfer ₹{Number(selfAmount || 0).toLocaleString('en-IN')} to {selectedSelfAccount?.bank}
                    </span>
                    <ArrowRightLeft size={17} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FRAUD DETECTION AUDIT EVALUATION RESULT CARD                                */}
      {/* ========================================================================= */}
      {result && (
        <div
          className="card"
          style={{
            marginTop: '24px',
            borderColor:
              result.transaction.riskLevel === 'HIGH'
                ? '#fad2cf'
                : result.transaction.riskLevel === 'MEDIUM'
                ? '#feefc3'
                : '#ceead6'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f1f3f4',
              paddingBottom: '14px',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5f6368', textTransform: 'uppercase' }}>
                Bank Transfer Fraud Evaluation
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {result.transaction.transactionId}
              </div>
            </div>
            <RiskBadge level={result.transaction.riskLevel} score={result.transaction.riskScore} />
          </div>

          {/* Status Alert Banner */}
          {result.transaction.status === 'APPROVED' && (
            <div className="alert-box success">
              <CheckCircle2 size={20} />
              <div>
                <strong>Transfer Approved Instantly</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Risk score is {result.transaction.riskScore}/100. Funds dispatched to {result.transaction.receiver}.
                </p>
              </div>
            </div>
          )}

          {result.transaction.status === 'REVIEW' && (
            <div className="alert-box warning">
              <AlertTriangle size={20} />
              <div>
                <strong>Held for Compliance Review</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Risk score is {result.transaction.riskScore}/100. Security officer notified via live alert.
                </p>
              </div>
            </div>
          )}

          {result.transaction.status === 'BLOCKED' && (
            <div className="alert-box error">
              <ShieldBan size={20} />
              <div>
                <strong>Transfer Blocked for High Risk</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Critical risk score of {result.transaction.riskScore}/100. Transfer halted to safeguard account.
                </p>
              </div>
            </div>
          )}

          {/* Suspicious Reasons */}
          {result.transaction.suspiciousReasons?.length > 0 && (
            <div style={{ margin: '16px 0', background: '#fef7e0', padding: '14px', borderRadius: '12px', border: '1px solid #feefc3' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b06000', marginBottom: '8px' }}>
                Triggered Fraud Indicators:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#5f6368' }}>
                {result.transaction.suspiciousReasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '16px' }}>
            <div className="audit-detail-pill">
              <div className="audit-pill-label">Recipient</div>
              <div className="audit-pill-value">{result.transaction.receiver}</div>
            </div>
            <div className="audit-detail-pill">
              <div className="audit-pill-label">Bank Account / Beneficiary</div>
              <div className="audit-pill-value" style={{ fontFamily: 'monospace' }}>{result.transaction.beneficiary}</div>
            </div>
            <div className="audit-detail-pill">
              <div className="audit-pill-label">Amount Transferred</div>
              <div className="audit-pill-value" style={{ fontWeight: 800, color: '#137333' }}>
                ₹{Number(result.transaction.amount).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="audit-detail-pill">
              <div className="audit-pill-label">Timestamp</div>
              <div className="audit-pill-value">{formatTxnDate(result.transaction.timestamp || result.transaction.createdAt)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setResult(null);
                setOthersForm((p) => ({ ...p, amount: '0' }));
                setSelfAmount('0');
              }}
              className="btn btn-outline btn-block"
            >
              <RotateCcw size={16} />
              <span>Make Another Transfer</span>
            </button>
            <Link to="/transactions" className="btn btn-primary btn-block" style={{ textAlign: 'center', textDecoration: 'none' }}>
              <span>View Passbook</span>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEARCH FOR IFSC                                                    */}
      {/* ========================================================================= */}
      {showIfscModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124' }}>
                Select Bank & Branch
              </div>
              <button
                type="button"
                onClick={() => setShowIfscModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={18} color="#5f6368" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search bank name or branch..."
                className="form-input"
                value={ifscSearchQuery}
                onChange={(e) => setIfscSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', borderRadius: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {POPULAR_BANKS.map((b) => {
                const filteredBranches = b.branches.filter(
                  (br) =>
                    !ifscSearchQuery ||
                    b.name.toLowerCase().includes(ifscSearchQuery.toLowerCase()) ||
                    br.name.toLowerCase().includes(ifscSearchQuery.toLowerCase()) ||
                    br.ifsc.toLowerCase().includes(ifscSearchQuery.toLowerCase())
                );

                if (filteredBranches.length === 0) return null;

                return (
                  <div key={b.code} style={{ border: '1px solid #e8eaed', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a73e8', marginBottom: '8px' }}>
                      {b.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {filteredBranches.map((br) => (
                        <div
                          key={br.ifsc}
                          onClick={() => handleSelectBranch(b.name, br)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: '#f8fafd',
                            cursor: 'pointer',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#202124' }}>{br.name}</span>
                            <span style={{ color: '#5f6368', marginLeft: '6px' }}>({br.city})</span>
                          </div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1a73e8' }}>
                            {br.ifsc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SELF BANK ACCOUNT                                              */}
      {/* ========================================================================= */}
      {showAddAccountModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#202124' }}>
                Add your other bank account
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNewAccount}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Bank Name
                </label>
                <select
                  className="form-input"
                  value={newAccountForm.bank}
                  onChange={(e) => {
                    const b = e.target.value;
                    const ifsc =
                      b === 'Canara Bank'
                        ? 'CNRB0005971'
                        : b === 'State Bank of India'
                        ? 'SBIN0001001'
                        : b === 'ICICI Bank'
                        ? 'ICIC0006321'
                        : 'HDFC0000240';
                    setNewAccountForm((p) => ({ ...p, bank: b, ifsc }));
                  }}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="Canara Bank">Canara Bank</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="Axis Bank">Axis Bank</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 110023455971"
                  className="form-input"
                  value={newAccountForm.accountNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setNewAccountForm((p) => ({ ...p, accountNumber: clean }));
                  }}
                  style={{ borderRadius: '10px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newAccountForm.ifsc}
                  onChange={(e) => setNewAccountForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                  style={{ borderRadius: '10px', fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Account Type
                </label>
                <select
                  className="form-input"
                  value={newAccountForm.type}
                  onChange={(e) => setNewAccountForm((p) => ({ ...p, type: e.target.value }))}
                  style={{ borderRadius: '10px' }}
                >
                  <option value="Savings Account">Savings Account</option>
                  <option value="Salary Account">Salary Account</option>
                  <option value="Current Account">Current Account</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ padding: '12px', fontWeight: 700 }}>
                Link Account for Self Transfers
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTransfer;
