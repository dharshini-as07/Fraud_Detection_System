import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Flashlight,
  QrCode,
  MoreVertical,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

const ScanQR = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraCaptureRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [scannedResult, setScannedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const upiId = user?.name
    ? `${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okhdfcbank`
    : 'user@okhdfcbank';

  // Play audio chime on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  // Parse QR string into transaction payload and redirect
  const handleQRData = (dataString) => {
    if (!dataString) return;
    setIsProcessing(true);
    playBeep();

    let transactionData = {
      receiver: 'Verified Merchant',
      beneficiary: 'merchant@upi',
      amount: '0',
      location: 'Chennai, Tamil Nadu, India',
      deviceId: 'DEV-MAC-CHROME-01'
    };

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(dataString);
      transactionData = { ...transactionData, ...parsed };
    } catch (e) {
      // Try parsing standard UPI URI: upi://pay?pa=...&pn=...&am=...
      if (dataString.startsWith('upi://pay') || dataString.includes('pa=')) {
        try {
          const queryString = dataString.split('?')[1] || dataString;
          const urlParams = new URLSearchParams(queryString);
          if (urlParams.get('pn')) transactionData.receiver = decodeURIComponent(urlParams.get('pn'));
          if (urlParams.get('pa')) transactionData.beneficiary = decodeURIComponent(urlParams.get('pa'));
          if (urlParams.get('am')) transactionData.amount = urlParams.get('am');
        } catch (err) {}
      } else {
        // Plain text: use as receiver / beneficiary
        transactionData.receiver = dataString.slice(0, 25);
        transactionData.beneficiary = dataString;
      }
    }

    setScannedResult(transactionData);
    stopCamera();

    // Redirect to GPay payment screen after brief visual confirmation
    setTimeout(() => {
      navigate('/create-transaction', {
        state: {
          receiver: transactionData.receiver,
          beneficiary: transactionData.beneficiary,
          amount: String(transactionData.amount || '0'),
          location: transactionData.location || 'Chennai, Tamil Nadu, India',
          deviceId: transactionData.deviceId || 'DEV-MAC-CHROME-01'
        }
      });
    }, 600);
  };

  // Start live camera stream (Works on desktop & HTTPS)
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraActive(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Toggle hardware flashlight / torch if available
  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      if (track) {
        try {
          const newTorchState = !torchOn;
          await track.applyConstraints({
            advanced: [{ torch: newTorchState }]
          });
          setTorchOn(newTorchState);
        } catch (e) {
          // torch constraint not supported on this device/browser
          setTorchOn((prev) => !prev);
        }
      }
    } else {
      setTorchOn((prev) => !prev);
    }
  };

  // Scan live video frames for QR code using jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (!isProcessing) requestAnimationFrame(scanVideoFrame);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleQRData(code.data);
    } else {
      if (!isProcessing) {
        requestAnimationFrame(scanVideoFrame);
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Process image from camera snap or gallery upload
  const processImageFile = (file) => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // Downscale large camera photos to max 1000px for instant decoding
        const maxDim = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        let code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });

        // If not found at 1000px and original was larger, try original resolution
        if (!code && (img.width !== w || img.height !== h)) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const origData = ctx.getImageData(0, 0, img.width, img.height);
          code = jsQR(origData.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
        }

        setIsProcessing(false);

        if (code && code.data) {
          handleQRData(code.data);
        } else {
          // If no QR found in photo, redirect with a standard merchant payment
          handleQRData(
            JSON.stringify({
              receiver: 'Scanned UPI Merchant',
              beneficiary: 'merchant@upi',
              amount: '0',
              location: 'Chennai, Tamil Nadu, India',
              deviceId: 'DEV-MAC-CHROME-01'
            })
          );
        }
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const copyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Google Sans', Roboto, 'Helvetica Neue', sans-serif"
      }}
    >
      {/* Hidden File Inputs */}
      {/* 1. Camera Capture: launches native camera shutter on mobile */}
      <input
        type="file"
        ref={cameraCaptureRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
      {/* 2. Photo Library / Gallery */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* Hidden Canvas used for frame processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Full-bleed Live Video Stream in Background */}
      <video
        ref={videoRef}
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: cameraActive ? 'block' : 'none',
          zIndex: 0
        }}
      />

      {/* Dark Translucent Backdrop when camera is not actively streaming */}
      {!cameraActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #18191c 0%, #0d0e11 100%)',
            zIndex: 0
          }}
        />
      )}

      {/* ----------------- TOP BAR ----------------- */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          color: '#ffffff'
        }}
      >
        {/* Left: Close Button */}
        <button
          onClick={() => {
            stopCamera();
            navigate('/dashboard');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close scanner"
        >
          <X size={26} strokeWidth={2.2} />
        </button>

        {/* Right Action Icons: Flashlight, Show QR, Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Flashlight Icon */}
          <button
            onClick={toggleTorch}
            style={{
              background: torchOn ? 'rgba(255,255,255,0.25)' : 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle Flashlight"
          >
            <Flashlight size={22} color={torchOn ? '#fde047' : '#ffffff'} />
          </button>

          {/* Show My QR Code Icon */}
          <button
            onClick={() => setShowMyQR(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Show My QR Code"
          >
            <QrCode size={22} />
          </button>

          {/* More Options (3 Dots) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="More options"
            >
              <MoreVertical size={22} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  background: '#242529',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth: '160px',
                  padding: '6px 0',
                  zIndex: 50,
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Flip Camera</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- CENTER RETICLE (GOOGLE 4-COLOR FRAME) ----------------- */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1
        }}
      >
        {/* The 4-Color Google Pay Scanning Frame */}
        <div
          onClick={() => {
            if (!cameraActive) {
              cameraCaptureRef.current?.click();
            }
          }}
          style={{
            position: 'relative',
            width: '270px',
            height: '270px',
            maxWidth: '75vw',
            maxHeight: '75vw',
            borderRadius: '26px',
            cursor: 'pointer'
          }}
        >
          {/* Top-Left: RED Corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '52px',
              height: '52px',
              borderTop: '5px solid #EA4335',
              borderLeft: '5px solid #EA4335',
              borderTopLeftRadius: '26px',
              pointerEvents: 'none'
            }}
          />

          {/* Top-Right: YELLOW Corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '52px',
              height: '52px',
              borderTop: '5px solid #FBBC05',
              borderRight: '5px solid #FBBC05',
              borderTopRightRadius: '26px',
              pointerEvents: 'none'
            }}
          />

          {/* Bottom-Left: BLUE Corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '52px',
              height: '52px',
              borderBottom: '5px solid #4285F4',
              borderLeft: '5px solid #4285F4',
              borderBottomLeftRadius: '26px',
              pointerEvents: 'none'
            }}
          />

          {/* Bottom-Right: GREEN Corner */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '52px',
              height: '52px',
              borderBottom: '5px solid #34A853',
              borderRight: '5px solid #34A853',
              borderBottomRightRadius: '26px',
              pointerEvents: 'none'
            }}
          />

          {/* Subtle Scanning Beam when camera is streaming */}
          {cameraActive && (
            <div
              style={{
                position: 'absolute',
                width: '85%',
                height: '2px',
                left: '7.5%',
                background: 'linear-gradient(90deg, transparent, #4285F4, #FBBC05, transparent)',
                boxShadow: '0 0 10px rgba(66, 133, 244, 0.8)',
                animation: 'gpay-scan-line 2.2s infinite ease-in-out',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Subdued Tap-to-snap hint when camera stream is not active */}
          {!cameraActive && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.55)',
                fontSize: '0.82rem',
                padding: '20px',
                textAlign: 'center',
                pointerEvents: 'none'
              }}
            >
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Tap to open camera</div>
            </div>
          )}

          {/* Success Overlay when QR is successfully scanned */}
          {scannedResult && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(52, 168, 83, 0.95)',
                borderRadius: '26px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                zIndex: 30
              }}
            >
              <CheckCircle2 size={54} color="#ffffff" />
              <div style={{ fontWeight: 800, fontSize: '1.15rem', marginTop: '10px' }}>
                QR Code Scanned!
              </div>
              <div style={{ fontSize: '0.88rem', opacity: 0.9, marginTop: '2px' }}>
                {scannedResult.receiver}
              </div>
            </div>
          )}
        </div>

        {/* ----------------- UPLOAD FROM GALLERY PILL BUTTON ----------------- */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          style={{
            marginTop: '28px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '9999px',
            padding: '11px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            color: '#1f1f1f',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
            transition: 'transform 0.15s ease, background-color 0.15s ease'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <ImageIcon size={19} color="#1f1f1f" />
          <span>Upload from gallery</span>
        </button>
      </div>

      {/* ----------------- BOTTOM SHEET / BAR ----------------- */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(28, 29, 33, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '28px 28px 0 0',
          padding: '14px 20px 24px',
          textAlign: 'center',
          color: '#ffffff',
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Top Drag Handle Line */}
        <div
          style={{
            width: '36px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
            borderRadius: '2px',
            margin: '0 auto 12px'
          }}
        />

        {/* Main Headline */}
        <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.2px' }}>
          Scan any QR code to pay
        </div>

        {/* Subtitle with UPI Brands */}
        <div style={{ fontSize: '0.78rem', color: '#9aa0a6', marginTop: '4px', fontWeight: 500 }}>
          Google Pay • PhonePe • Paytm • UPI
        </div>
      </div>

      {/* ----------------- MODAL: SHOW MY QR CODE ----------------- */}
      {showMyQR && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999
          }}
          onClick={() => setShowMyQR(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '26px 22px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMyQR(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f3f4',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} color="#5f6368" />
            </button>

            {/* User Avatar Circle */}
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#1a73e8',
                color: '#ffffff',
                fontSize: '1.4rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#202124' }}>
              {user?.name || 'Customer'}
            </div>

            <div
              onClick={copyUpi}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#1a73e8',
                backgroundColor: '#e8f0fe',
                padding: '4px 10px',
                borderRadius: '9999px',
                marginTop: '6px',
                cursor: 'pointer'
              }}
              title="Click to copy UPI ID"
            >
              <span>{upiId}</span>
              {copiedUpi ? <Check size={12} color="#188038" /> : <Copy size={12} />}
            </div>

            {/* Generated QR Code Image */}
            <div
              style={{
                background: '#ffffff',
                padding: '12px',
                border: '1px solid #e8eaed',
                borderRadius: '16px',
                display: 'inline-block',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                margin: '18px 0 12px'
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=${upiId}&pn=${encodeURIComponent(user?.name || 'Customer')}&cu=INR`
                )}`}
                alt="My UPI QR Code"
                style={{ width: '190px', height: '190px', display: 'block', borderRadius: '8px' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#5f6368' }}>
              Scan with any UPI app to pay me
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SCAN ANIMATION STYLES ----------------- */}
      <style>
        {`
          @keyframes gpay-scan-line {
            0% { top: 10%; opacity: 0.3; }
            50% { top: 88%; opacity: 1; }
            100% { top: 10%; opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
};

export default ScanQR;
