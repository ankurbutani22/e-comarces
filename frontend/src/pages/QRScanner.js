import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendDeliveryOtp, updateSellerOrderStatus } from '../services/authService';
import jsQR from 'jsqr';

function QRScanner({ token, user }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [manualOrderId, setManualOrderId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanEngine, setScanEngine] = useState('');

  const canScan = useMemo(
    () => user?.role === 'seller' || user?.role === 'admin' || user?.role === 'delivery_boy',
    [user]
  );
  const isDeliveryMode = user?.role === 'delivery_boy';

  useEffect(() => {
    if (!canScan) {
      navigate('/unauthorized');
      return undefined;
    }

    let active = true;

    const parseQrPayload = (rawValue) => {
      if (!rawValue || typeof rawValue !== 'string') return null;

      try {
        const parsed = JSON.parse(rawValue);

        if (typeof parsed === 'string') {
          return { orderId: parsed };
        }

        if (parsed && typeof parsed === 'object') {
          if (parsed.orderId) return parsed;
          if (parsed.id) return { ...parsed, orderId: parsed.id };
        }
      } catch (parseError) {
        const trimmed = rawValue.trim();
        if (/^[a-f0-9]{24}$/i.test(trimmed)) {
          return { orderId: trimmed };
        }
      }

      return null;
    };

    const markScanSuccess = (payload) => {
      setScanResult(payload);
      setManualOrderId(payload.orderId || '');
      setError('');
      setSuccess('QR code scanned successfully');
    };

    const startScanner = async () => {
      try {
        setError('');

        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera access is not supported in this browser');
          return;
        }

        const BarcodeDetectorClass = window.BarcodeDetector;
        if (BarcodeDetectorClass) {
          detectorRef.current = new BarcodeDetectorClass({ formats: ['qr_code'] });
          setScanEngine('BarcodeDetector');
        } else {
          detectorRef.current = null;
          setScanEngine('jsQR');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraReady(true);

        const scanFrame = async () => {
          if (!active || !videoRef.current) return;

          const video = videoRef.current;
          if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
            rafRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          try {
            let decodedText = '';

            if (detectorRef.current) {
              const barcodes = await detectorRef.current.detect(video);
              if (barcodes.length > 0) {
                decodedText = barcodes[0].rawValue || '';
              }
            }

            if (!decodedText && canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });

              if (ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const qr = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'attemptBoth'
                });

                if (qr?.data) {
                  decodedText = qr.data;
                }
              }
            }

            if (decodedText) {
              const payload = parseQrPayload(decodedText);
              if (payload?.orderId) {
                markScanSuccess(payload);
                return;
              }

              setError('Scanned QR is not valid order data');
              setSuccess('');
            }
          } catch (scanError) {
            setError('Unable to read QR from camera feed');
          }

          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start camera');
        setScanEngine('');
      }
    };

    startScanner();

    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [canScan, navigate]);

  const acceptOrder = async () => {
    const targetOrderId = (scanResult?.orderId || manualOrderId || '').trim();

    if (!targetOrderId) {
      setError('Please scan a valid order QR first');
      return;
    }

    try {
      setBusy(true);
      setError('');
      if (isDeliveryMode) {
        const response = await sendDeliveryOtp(token, targetOrderId);
        const devHint = response?.data?.devOtp ? ` Dev OTP: ${response.data.devOtp}` : '';
        setSuccess(`${response.message || 'OTP sent successfully'}${devHint}`);
      } else {
        await updateSellerOrderStatus(token, targetOrderId, 'processing');
        setSuccess('Order marked as processing');
      }
    } catch (err) {
      setError(err.response?.data?.message || (isDeliveryMode ? 'Failed to send OTP' : 'Failed to accept order'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scanner-shell">
      <div className="page-head">
        <h2 className="page-title">QR Scanner</h2>
        <button type="button" onClick={() => navigate(isDeliveryMode ? '/delivery' : '/seller')}>
          {isDeliveryMode ? 'Back to Delivery Panel' : 'Back to Seller Panel'}
        </button>
      </div>

      <p className="page-subtitle">
        {isDeliveryMode
          ? 'Scan order QR code and send OTP to customer phone for secure delivery confirmation.'
          : 'Scan the QR code printed on the bill or shown on the invoice to quickly accept the order.'}
      </p>

      {error ? <div className="error page-feedback">{error}</div> : null}
      {success ? <div className="success-msg page-feedback">{success}</div> : null}

      <div className="scanner-video-card">
        {scanEngine ? <p className="scanner-engine">Scanning engine: {scanEngine}</p> : null}
        <video
          ref={videoRef}
          style={{ width: '100%', display: cameraReady ? 'block' : 'none' }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {!cameraReady ? (
          <div className="scanner-placeholder">
            {error ? 'Camera unavailable' : 'Starting camera...'}
          </div>
        ) : null}
      </div>

      <section className="scanner-result-card">
        <h3>Scanned Order</h3>
        <div className="scanner-manual-row">
          <input
            type="text"
            className="scanner-manual-input"
            placeholder="Enter Order ID manually"
            value={manualOrderId}
            onChange={(e) => setManualOrderId(e.target.value)}
          />
        </div>
        {scanResult ? (
          <>
            <p><strong>Order ID:</strong> {scanResult.orderId || '-'}</p>
            <p><strong>Status:</strong> {scanResult.status || '-'}</p>
            <p><strong>Total:</strong> Rs. {scanResult.total || '-'}</p>
            <button type="button" onClick={acceptOrder} disabled={busy}>
              {busy ? (isDeliveryMode ? 'Sending OTP...' : 'Accepting...') : (isDeliveryMode ? 'Send OTP to Customer' : 'Accept Order')}
            </button>
          </>
        ) : (
          <p>No QR scanned yet.</p>
        )}
      </section>
    </div>
  );
}

export default QRScanner;
