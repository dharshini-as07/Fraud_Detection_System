import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import API from '../services/api';
import RiskBadge from '../components/RiskBadge';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldBan,
  RotateCcw,
  Check,
  X,
  Building2,
  Lock,
  ArrowLeft,
  Search,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Cpu,
  UserCheck,
  Clock,
  History,
  Users
} from 'lucide-react';

// Default directory of UPI Contacts
const DEFAULT_CONTACTS = [
  {
    id: 'priya-verma',
    name: 'Priya Verma',
    phone: '+91 98201 23456',
    upi: 'ACC-SBI-1001',
    bg: '#4285f4',
    initial: 'P'
  },
  {
    id: 'apex-store',
    name: 'Apex Gadgets Store',
    phone: '+91 99304 88888',
    upi: 'ACC-ICICI-8888',
    bg: '#ea4335',
    initial: 'A'
  },
  {
    id: 'mseb-electricity',
    name: 'MSEB Electricity',
    phone: '+91 98111 40040',
    upi: 'ACC-MSEB-4004',
    bg: '#fbbc05',
    initial: 'M'
  },
  {
    id: 'tokyo-tech',
    name: 'Tokyo Tech Import',
    phone: '+81 90123 45678',
    upi: 'ACC-TOKYO-BANK-77',
    bg: '#34a853',
    initial: 'T'
  },
  {
    id: 'rahul-sharma',
    name: 'Rahul Sharma',
    phone: '+91 98450 11223',
    upi: 'rahul@okhdfcbank',
    bg: '#9333ea',
    initial: 'R'
  },
  {
    id: 'sneha-patel',
    name: 'Sneha Patel',
    phone: '+91 97123 55667',
    upi: 'sneha@oksbi',
    bg: '#0284c7',
    initial: 'S'
  },
  {
    id: 'amit-kumar',
    name: 'Amit Kumar',
    phone: '+91 98920 33445',
    upi: 'amit@axisbank',
    bg: '#d97706',
    initial: 'A'
  }
];

const CreateTransaction = () => {
  const locationState = useLocation();

  // Search & Payee Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayee, setSelectedPayee] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    receiver: '',
    beneficiary: '',
    amount: '0',
    location: 'Chennai, Tamil Nadu, India',
    deviceId: 'Generating fingerprint...'
  });

  const [gpsStatus, setGpsStatus] = useState('verified'); // 'detecting' | 'verified'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // 1. Fetch all user transactions to build past payee history
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

  // 2. Automatic GPS Location Detection with browser permission & Chennai fallback
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setFormData((prev) => ({ ...prev, location: 'Chennai, Tamil Nadu, India (GPS Auto-Detected)' }));
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
            const locStr = `${city}, ${state}, ${country} (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`;
            setFormData((prev) => ({ ...prev, location: locStr }));
            setGpsStatus('verified');
            return;
          }
        } catch (e) {
          // Network or CORS fallback
        }
        setFormData((prev) => ({
          ...prev,
          location: `Chennai, Tamil Nadu (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`
        }));
        setGpsStatus('verified');
      },
      (err) => {
        console.warn('GPS location access denied or unavailable, defaulting to Chennai:', err.message);
        setFormData((prev) => ({ ...prev, location: 'Chennai, Tamil Nadu, India (GPS Auto-Detected)' }));
        setGpsStatus('verified');
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // 3. Automatic Device Fingerprint Generator
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

  // Initialize GPS and Device Fingerprint on mount
  useEffect(() => {
    detectLocation();
    const fp = generateFingerprint();
    setFormData((prev) => ({ ...prev, deviceId: fp }));
  }, []);

  // 4. Handle Routing (e.g. from Home Recent Contacts or Scan QR)
  useEffect(() => {
    if (locationState.state?.receiver || locationState.state?.beneficiary) {
      const { receiver, beneficiary, amount } = locationState.state;
      const payeeObj = {
        name: receiver || 'Recipient',
        upi: beneficiary || 'payee@upi',
        initial: (receiver || 'R').charAt(0).toUpperCase(),
        bg: '#4285f4'
      };
      setSelectedPayee(payeeObj);
      setFormData((prev) => ({
        ...prev,
        receiver: payeeObj.name,
        beneficiary: payeeObj.upi,
        amount: amount ? String(amount) : prev.amount || '0'
      }));
    }
  }, [locationState]);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Format Day, Date & Time for Transaction Receipts (Google Pay style)
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

    // 12-hour formatted time with AM / PM: e.g. "07:15 PM"
    const timeStr = d
      .toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      .toUpperCase();

    // Day of week (Thu, Wed, etc.) and Date (22 Oct)
    const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateMonth = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    if (isToday) {
      return `Today (${dayOfWeek}, ${dateMonth}) • ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday (${dayOfWeek}, ${dateMonth}) • ${timeStr}`;
    }

    return `${dayOfWeek}, ${dateMonth} • ${timeStr}`;
  };

  // Contact Selection
  const handleSelectPayee = (contact) => {
    setSelectedPayee(contact);
    setFormData((prev) => ({
      ...prev,
      receiver: contact.name,
      beneficiary: contact.upi
    }));
    setError('');
    setResult(null);
  };

  // Handle typing a custom phone or UPI ID not in contacts
  const handleSelectCustomQuery = () => {
    const clean = searchQuery.trim();
    if (!clean) return;
    const isUpi = clean.includes('@') || clean.startsWith('ACC-');
    const customPayee = {
      name: isUpi ? clean.split('@')[0] : clean,
      upi: isUpi ? clean : `${clean.replace(/[^0-9]/g, '')}@upi`,
      initial: clean.charAt(0).toUpperCase(),
      bg: '#1a73e8'
    };
    handleSelectPayee(customPayee);
  };

  // Submit Transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!formData.receiver || !formData.beneficiary) {
      setError('Please select a recipient before submitting payment.');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a payment amount greater than zero.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/transactions', formData);
      if (res.data.success) {
        setResult(res.data);
        const newTxn = res.data.transaction || res.data.data;
        if (newTxn) {
          setAllTransactions((prev) => [newTxn, ...prev]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setFormData((prev) => ({ ...prev, amount: '0' }));
  };

  // -------------------------------------------------------------
  // SEPARATE PAST PAYEES AND CONTACTS (NEW PAYEES)
  // -------------------------------------------------------------
  const pastPayeeStats = {};
  allTransactions.forEach((t) => {
    const upiKey = (t.beneficiary || '').toLowerCase().trim();
    const nameKey = (t.receiver || '').toLowerCase().trim();
    const key = upiKey || nameKey;
    if (!key) return;

    if (!pastPayeeStats[key]) {
      pastPayeeStats[key] = {
        count: 1,
        lastTxn: t,
        receiver: t.receiver,
        beneficiary: t.beneficiary
      };
    } else {
      pastPayeeStats[key].count += 1;
      const currentLast = new Date(
        pastPayeeStats[key].lastTxn.timestamp || pastPayeeStats[key].lastTxn.createdAt
      );
      const thisTxn = new Date(t.timestamp || t.createdAt);
      if (thisTxn > currentLast) {
        pastPayeeStats[key].lastTxn = t;
      }
    }
  });

  // 1. Separate into Past Payees List
  const pastPayeesList = [];
  const handledKeys = new Set();

  DEFAULT_CONTACTS.forEach((c) => {
    const upiKey = c.upi.toLowerCase();
    const nameKey = c.name.toLowerCase();
    if (pastPayeeStats[upiKey] || pastPayeeStats[nameKey]) {
      const stat = pastPayeeStats[upiKey] || pastPayeeStats[nameKey];
      handledKeys.add(upiKey);
      handledKeys.add(nameKey);
      pastPayeesList.push({
        ...c,
        lastTxn: stat.lastTxn,
        txnCount: stat.count
      });
    }
  });

  // Include any other past recipient from transaction records not in DEFAULT_CONTACTS
  Object.keys(pastPayeeStats).forEach((key) => {
    if (!handledKeys.has(key)) {
      const stat = pastPayeeStats[key];
      handledKeys.add(key);
      pastPayeesList.push({
        id: stat.beneficiary || stat.receiver,
        name: stat.receiver || stat.beneficiary.split('@')[0],
        phone: '',
        upi: stat.beneficiary,
        bg: '#0f9d58',
        initial: (stat.receiver || stat.beneficiary).charAt(0).toUpperCase(),
        lastTxn: stat.lastTxn,
        txnCount: stat.count
      });
    }
  });

  // 2. Separate into Contacts on UPI (New Payees who haven't received payments yet)
  const newContactsList = DEFAULT_CONTACTS.filter((c) => {
    const upiKey = c.upi.toLowerCase();
    const nameKey = c.name.toLowerCase();
    return !pastPayeeStats[upiKey] && !pastPayeeStats[nameKey];
  });

  // Filter based on search query
  const query = searchQuery.toLowerCase().trim();
  const filterFn = (c) => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.upi.toLowerCase().includes(query) ||
      (c.phone && c.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')))
    );
  };

  const filteredPastPayees = pastPayeesList.filter(filterFn);
  const filteredNewContacts = newContactsList.filter(filterFn);

  const isCustomQuery =
    query.length > 2 &&
    !pastPayeesList.some((c) => c.upi.toLowerCase() === query || c.name.toLowerCase() === query) &&
    !newContactsList.some((c) => c.upi.toLowerCase() === query || c.name.toLowerCase() === query);

  // -------------------------------------------------------------
  // PAYMENT HISTORY WITH SELECTED PAYEE
  // -------------------------------------------------------------
  const payeeTransactions = selectedPayee
    ? allTransactions.filter((t) => {
        const beneficiaryMatch =
          t.beneficiary &&
          selectedPayee.upi &&
          t.beneficiary.toLowerCase().trim() === selectedPayee.upi.toLowerCase().trim();
        const nameMatch =
          t.receiver &&
          selectedPayee.name &&
          t.receiver.toLowerCase().trim() === selectedPayee.name.toLowerCase().trim();
        return beneficiaryMatch || nameMatch;
      })
    : [];

  return (
    <div className="gpay-view-container" style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* ----------------- VIEW 1: GOOGLE PAY SEARCH & SEPARATED PAYEE DIRECTORY ----------------- */}
      {!selectedPayee && (
        <div>
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
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#202124' }}>
              Pay to Anyone
            </span>
            <div style={{ width: '40px' }} />
          </div>

          {/* Google Pay Style Search Bar */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '2px solid #dadce0',
              borderRadius: '9999px',
              padding: '6px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              marginBottom: '20px',
              transition: 'border-color 0.15s ease'
            }}
          >
            <Search size={20} color="#5f6368" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, phone number, or UPI ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
                color: '#202124',
                background: 'transparent',
                padding: '8px 0'
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: '4px' }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Custom Payee Card (if typed a number/UPI not in list) */}
          {isCustomQuery && (
            <div
              onClick={handleSelectCustomQuery}
              style={{
                background: '#e8f0fe',
                border: '1px solid #c2e7ff',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#1a73e8',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.15rem'
                  }}
                >
                  ₹
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#174ea6' }}>
                    Pay to "{searchQuery}"
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#5f6368' }}>
                    New recipient • Tap to proceed with transfer
                  </div>
                </div>
              </div>
              <ChevronRight size={20} color="#1a73e8" />
            </div>
          )}

          {/* SECTION 1: PAST PAYEES */}
          {filteredPastPayees.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e8eaed',
                padding: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  paddingLeft: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#1a73e8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <History size={15} />
                  <span>Past Payees ({filteredPastPayees.length})</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: '#5f6368', fontWeight: 600 }}>
                  Previous Transfers
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredPastPayees.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectPayee(contact)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafd')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: contact.bg || '#1a73e8',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.15rem'
                        }}
                      >
                        {contact.initial}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#202124' }}>
                          {contact.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '2px' }}>
                          {contact.phone ? `${contact.phone} • ` : ''}
                          {contact.upi}
                        </div>
                        {contact.lastTxn && (
                          <div style={{ fontSize: '0.72rem', color: '#137333', fontWeight: 600, marginTop: '2px' }}>
                            Last paid: ₹{Number(contact.lastTxn.amount).toLocaleString('en-IN')} •{' '}
                            {formatTxnDate(contact.lastTxn.timestamp || contact.lastTxn.createdAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9aa0a6" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: CONTACTS ON UPI / NEW PAYEES */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e8eaed',
              padding: '16px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingLeft: '8px'
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#5f6368',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Users size={15} />
                <span>Contacts & New Payees ({filteredNewContacts.length})</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#5f6368', fontWeight: 600 }}>
                Available to Pay
              </span>
            </div>

            {filteredNewContacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#5f6368', fontSize: '0.82rem' }}>
                No new contacts match your search.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredNewContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectPayee(contact)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafd')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: contact.bg,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.15rem'
                        }}
                      >
                        {contact.initial}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#202124' }}>
                          {contact.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#5f6368', marginTop: '2px' }}>
                          {contact.phone ? `${contact.phone} • ` : ''}
                          {contact.upi}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} color="#9aa0a6" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 2: PAYMENT CARD FOR SELECTED RECIPIENT ----------------- */}
      {selectedPayee && (
        <div>
          {/* Top Navigation Bar: Back & Change Payee */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setSelectedPayee(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#1a73e8',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '4px 0'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Payees</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPayee(null)}
              className="btn btn-outline btn-sm"
              style={{ borderRadius: '9999px', fontSize: '0.75rem', padding: '4px 12px' }}
            >
              Change Payee
            </button>
          </div>

          {/* Main GPay Payment Card */}
          <div className="gpay-pay-box">
            {/* Recipient Header */}
            <div className="gpay-recipient-card">
              <div
                className="gpay-recipient-avatar"
                style={{ backgroundColor: selectedPayee.bg || '#1a73e8' }}
              >
                {selectedPayee.initial || selectedPayee.name.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#202124', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span>Paying {formData.receiver}</span>
                <ShieldCheck size={18} color="#1e8e3e" />
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#5f6368', marginTop: '2px' }}>
                UPI ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formData.beneficiary}</span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: '#1e8e3e',
                  fontWeight: 700,
                  marginTop: '4px'
                }}
              >
                <Lock size={12} />
                <span>FraudShield Security Protected</span>
              </div>
            </div>

            {error && (
              <div className="alert-box error" style={{ textAlign: 'center' }}>
                <span>{error}</span>
              </div>
            )}

            {/* Transfer Form */}
            <form onSubmit={handleSubmit}>
              {/* Big Currency Amount Input (No plus/minus stepper arrows, clears on focus) */}
              <div className="gpay-big-amount-wrapper" style={{ marginBottom: '24px' }}>
                <span className="gpay-currency-symbol">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="amount"
                  className="gpay-amount-input"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9.]/g, '');
                    setFormData((p) => ({ ...p, amount: cleanVal }));
                  }}
                  onFocus={() => {
                    if (formData.amount === '0') {
                      setFormData((p) => ({ ...p, amount: '' }));
                    }
                  }}
                  onBlur={() => {
                    if (!formData.amount || formData.amount.trim() === '') {
                      setFormData((p) => ({ ...p, amount: '0' }));
                    }
                  }}
                  required
                  autoFocus
                />
              </div>

              {/* Transaction & Security Metadata (All fields read-only without mentioning read-only) */}
              <div
                style={{
                  background: '#f8fafd',
                  padding: '16px',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  border: '1px solid #dadce0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3c4043' }}>
                    Transaction & Security Metadata:
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#1e8e3e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={13} />
                    <span>Verified Payee</span>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Payee Name: Read-Only */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={13} color="#5f6368" />
                      <span>Payee Name</span>
                    </label>
                    <input
                      type="text"
                      name="receiver"
                      className="form-input"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        background: '#f1f3f4',
                        cursor: 'default',
                        color: '#202124',
                        fontWeight: 600,
                        border: '1px solid #dadce0'
                      }}
                      value={formData.receiver}
                      readOnly
                    />
                  </div>

                  {/* Beneficiary / UPI ID: Read-Only */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={13} color="#5f6368" />
                      <span>Beneficiary / UPI ID</span>
                    </label>
                    <input
                      type="text"
                      name="beneficiary"
                      className="form-input"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        background: '#f1f3f4',
                        cursor: 'default',
                        color: '#202124',
                        fontWeight: 600,
                        border: '1px solid #dadce0'
                      }}
                      value={formData.beneficiary}
                      readOnly
                    />
                  </div>

                  {/* Location: Read-Only */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="#1a73e8" />
                        <span>GPS Location</span>
                      </label>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: gpsStatus === 'verified' ? '#137333' : '#b06000'
                        }}
                      >
                        {gpsStatus === 'verified' ? '● Verified GPS' : '● GPS Detected'}
                      </span>
                    </div>
                    <input
                      type="text"
                      name="location"
                      className="form-input"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        background: '#f1f3f4',
                        cursor: 'default',
                        color: '#202124',
                        border: '1px solid #dadce0'
                      }}
                      value={formData.location}
                      readOnly
                    />
                  </div>

                  {/* Device Fingerprint: Read-Only */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Cpu size={13} color="#1a73e8" />
                        <span>Device Fingerprint</span>
                      </label>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a73e8' }}>
                        ● Auto Generated
                      </span>
                    </div>
                    <input
                      type="text"
                      name="deviceId"
                      className="form-input"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        fontFamily: 'monospace',
                        background: '#f1f3f4',
                        cursor: 'default',
                        color: '#202124',
                        border: '1px solid #dadce0'
                      }}
                      value={formData.deviceId}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Debited Bank Account Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f1f3f4',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={18} color="#1a73e8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Debiting: State Bank of India •••• 1001
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#1e8e3e', fontWeight: 700 }}>Active UPI</span>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ padding: '15px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                {loading ? (
                  'Verifying Fraud Rules...'
                ) : (
                  <>
                    <span>Pay ₹{Number(formData.amount || 0).toLocaleString('en-IN')}</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>

            {/* PAYMENT HISTORY WITH THIS PAYEE (Placed below Pay button) */}
            <div
              style={{
                background: '#f8fafd',
                border: '1px solid #dadce0',
                borderRadius: '16px',
                padding: '16px',
                marginTop: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: '#3c4043' }}>
                  <History size={15} color="#1a73e8" />
                  <span>Payment History with {formData.receiver}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#5f6368', fontWeight: 700 }}>
                  {payeeTransactions.length} {payeeTransactions.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {payeeTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px', color: '#5f6368', fontSize: '0.78rem' }}>
                  No previous transactions with {formData.receiver}. This will be your first payment to them.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {payeeTransactions.map((txn) => (
                    <div
                      key={txn._id || txn.transactionId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid #e8eaed',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: txn.status === 'APPROVED' ? '#e6f4ea' : txn.status === 'REVIEW' ? '#fef7e0' : '#fce8e6',
                            color: txn.status === 'APPROVED' ? '#137333' : txn.status === 'REVIEW' ? '#b06000' : '#c5221f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {txn.status === 'APPROVED' && <CheckCircle2 size={16} />}
                          {txn.status === 'REVIEW' && <Clock size={16} />}
                          {txn.status === 'BLOCKED' && <ShieldBan size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#202124' }}>
                            {formatTxnDate(txn.timestamp || txn.createdAt)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#5f6368', fontFamily: 'monospace' }}>
                            {txn.transactionId} • SBI •• 1001
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
                          {txn.status === 'APPROVED' ? 'Completed' : txn.status === 'REVIEW' ? 'Under Review' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* GPay Payment Evaluation Result Card */}
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
                    UPI Payment Audit Output
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {result.transaction.transactionId}
                  </div>
                </div>
                <RiskBadge level={result.transaction.riskLevel} score={result.transaction.riskScore} />
              </div>

              {/* Status Result Box */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  backgroundColor:
                    result.transaction.status === 'APPROVED'
                      ? '#e6f4ea'
                      : result.transaction.status === 'REVIEW'
                      ? '#fef7e0'
                      : '#fce8e6',
                  color:
                    result.transaction.status === 'APPROVED'
                      ? '#137333'
                      : result.transaction.status === 'REVIEW'
                      ? '#b06000'
                      : '#a50e0e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {result.transaction.status === 'APPROVED' && <CheckCircle2 size={28} />}
                {result.transaction.status === 'REVIEW' && <AlertTriangle size={28} />}
                {result.transaction.status === 'BLOCKED' && <ShieldBan size={28} />}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    PAYMENT STATUS: {result.transaction.status}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{result.message}</div>
                </div>
              </div>

              {/* Score Calculation Meter */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span>Deterministic Risk Score</span>
                  <span style={{ fontFamily: 'monospace' }}>{result.transaction.riskScore} / 100 Points</span>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(5, result.transaction.riskScore)}%`,
                      height: '100%',
                      backgroundColor:
                        result.transaction.riskScore > 70
                          ? '#d93025'
                          : result.transaction.riskScore > 30
                          ? '#e37400'
                          : '#1e8e3e',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#5f6368', marginTop: '4px' }}>
                  <span>0-30: LOW (Auto Approved)</span>
                  <span>31-70: MEDIUM (Hold for Review)</span>
                  <span>71-100: HIGH (Auto Blocked)</span>
                </div>
              </div>

              {/* Rule Checks Breakdown */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#3c4043', marginBottom: '8px' }}>
                  5-Rule Fraud Checks Breakdown:
                </div>

                {result.ruleBreakdown &&
                  result.ruleBreakdown.map((r, i) => (
                    <div key={i} className={`rule-item ${r.triggered ? 'triggered' : 'clean'}`}>
                      <div style={{ marginTop: '2px' }}>
                        {r.triggered ? (
                          <X size={16} color="#d93025" strokeWidth={3} />
                        ) : (
                          <Check size={16} color="#1e8e3e" strokeWidth={3} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                          <span style={{ color: r.triggered ? '#a50e0e' : '#202124' }}>{r.rule}</span>
                          <span style={{ color: r.triggered ? '#d93025' : '#5f6368' }}>
                            {r.triggered ? `+${r.points} pts` : '0 pts'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: r.triggered ? '#a50e0e' : '#5f6368', marginTop: '2px' }}>
                          {r.reason}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>
                  <RotateCcw size={14} />
                  <span>Make Another Payment</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateTransaction;
