import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import toast from 'react-hot-toast';
import { reportService } from '../services/api';

// ── Severity helpers ────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  Critical: { color: 'bg-error-container text-error', icon: 'emergency', dot: 'bg-error', label: 'Critical — Immediate danger. Deep structural damage.' },
  High:     { color: 'bg-tertiary-container text-tertiary', icon: 'warning', dot: 'bg-tertiary', label: 'High — Serious risk. Requires urgent attention.' },
  Medium:   { color: 'bg-surface-container-high text-on-surface', icon: 'priority_high', dot: 'bg-outline', label: 'Medium — Moderate pothole. Attention needed soon.' },
  Low:      { color: 'bg-secondary-container text-secondary', icon: 'info', dot: 'bg-secondary', label: 'Low — Minor surface damage detected.' },
};

export default function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState('select'); // 'select' | 'preview' | 'success'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');

  // Upload & AI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  // GPS state
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // ── GPS capture ──────────────────────────────────────────────────────────
  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setGpsError('Location access denied. Using approximate coordinates.');
        // Use a default location as fallback so the form can still submit
        setGps({ lat: 19.0760, lng: 72.8777, accuracy: 9999, fallback: true });
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  // ── File selection handler ───────────────────────────────────────────────
  const handleFileSelected = async (file) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP)');
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAiResult(null);
    setCloudinaryUrl(null);

    // Kick off GPS capture immediately
    captureGPS();

    // Upload to Cloudinary
    await uploadToCloudinary(file);
  };

  // ── Upload to Cloudinary ─────────────────────────────────────────────────
  const uploadToCloudinary = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    setStep('preview');

    // Simulate progress ticks
    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 12, 85));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await reportService.uploadImage(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setCloudinaryUrl(res.data.imageUrl);
      setCloudinaryPublicId(res.data.publicId);
      toast.success('Image uploaded!');

      // Auto-run AI detection — send the actual file for real pixel analysis
      await runAiDetection(res.data.imageUrl, file);
    } catch (err) {
      clearInterval(progressInterval);
      const msg = err.response?.data?.message || 'Upload failed';
      toast.error(msg);
      console.error('[SCAN] Upload error:', err);
      setStep('select');
    } finally {
      setUploading(false);
    }
  };

  // ── HuggingFace YOLOS Pothole Detection ──────────────────────────────────
  const runAiDetection = async (imageUrl, file) => {
    setDetecting(true);
    try {
      let res;

      if (file) {
        // Send actual image bytes to HuggingFace model
        const formData = new FormData();
        formData.append('image', file);
        res = await reportService.detectFile(formData);
      } else {
        res = await reportService.detectHazard(imageUrl);
      }

      const data = res.data;

      // Only reset if confirmed non-road image (not a tech error)
      if (data.notRoadError && data.isRoad === false) {
        toast.error(data.notRoadError, { duration: 5000 });
        setStep('select');
        setSelectedFile(null);
        setPreviewUrl(null);
        setCloudinaryUrl(null);
        setCloudinaryPublicId(null);
        setAiResult(null);
        return;
      }

      setAiResult(data);

      if (data.warning) {
        toast(data.warning, { icon: '⚠️', duration: 4000 });
      } else if (data.detected) {
        const plural = data.count > 1 ? `${data.count} potholes` : '1 pothole';
        toast.success(`🚨 ${data.detected ? plural + ' detected' : 'No pothole'}! ${data.confidence}% — ${data.severity}`);
      } else {
        toast('🛣️ No pothole detected in this photo', { duration: 4000 });
      }

    } catch (err) {
      console.error('[SCAN] AI detection error:', err);
      setAiResult({ detected: false, label: 'Detection error', confidence: 0, severity: 'Medium', method: 'error' });
    } finally {
      setDetecting(false);
    }
  };

  // ── Submit final report ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!cloudinaryUrl) {
      toast.error('Image upload is not complete yet');
      return;
    }
    if (!gps) {
      toast.error('Still fetching your GPS location, please wait...');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        imageUrl: cloudinaryUrl,
        imagePublicId: cloudinaryPublicId || '',
        latitude: gps.lat,
        longitude: gps.lng,
        location: gps.fallback ? 'Mumbai, India (approximate)' : `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
        severity: aiResult?.severity || 'Medium',
        confidence: aiResult?.confidence || 0,
        aiDetectionResult: aiResult || {},
        description,
      };

      await reportService.createReport(payload);
      toast.success('Report saved to database!');
      setStep('success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit report';
      toast.error(msg);
      console.error('[SCAN] Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('select');
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setCloudinaryUrl(null);
    setCloudinaryPublicId(null);
    setAiResult(null);
    setGps(null);
    setGpsError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const severity = aiResult?.severity || 'Medium';
  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Medium;

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col relative antialiased">
      <TopAppBar />

      {/* ── SELECT IMAGE STEP ─────────────────────────────────────────── */}
      {step === 'select' && (
        <main className="flex-grow w-full max-w-2xl mx-auto p-margin-mobile flex flex-col pt-8 pb-32">
          {/* Header */}
          <div className="mb-stack-lg">
            <h2 className="text-h1 font-h1 text-on-surface mb-2">Report Hazard</h2>
            <p className="text-body-md text-on-surface-variant">Help keep our roads safe by reporting an issue.</p>
          </div>

          {/* Step 1: Select Image Container */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-label-bold font-label-bold tracking-wider text-on-surface-variant uppercase">Select Image</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Take Photo Card — opens camera on mobile */}
              <div className="relative bg-surface border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square group shadow-sm overflow-hidden cursor-pointer">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                />
                <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
                <span className="text-body-lg font-bold text-on-surface">Take Photo</span>
                <span className="text-body-sm text-on-surface-variant">Use camera</span>
              </div>

              {/* Upload Photo Card */}
              <div className="relative bg-surface border border-outline-variant/30 hover:border-secondary/50 hover:bg-surface-container-low transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square group shadow-sm overflow-hidden cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                />
                <div className="w-14 h-14 rounded-full bg-secondary-container/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                </div>
                <span className="text-body-lg font-bold text-on-surface">Upload Photo</span>
                <span className="text-body-sm text-on-surface-variant">From gallery</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">Tips:</strong> Take a clear photo of the pothole from above. Good lighting helps the AI detect it more accurately.
            </p>
          </div>
        </main>
      )}

      {/* ── PREVIEW / ANALYZE STEP ────────────────────────────────────── */}
      {step === 'preview' && (
        <main className="flex-grow w-full max-w-2xl mx-auto p-margin-mobile flex flex-col pt-8 pb-32">
          {/* Header & Back */}
          <div className="flex items-center gap-4 mb-stack-lg">
            <button onClick={handleReset} className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-h2 font-h2 text-on-surface">Review Details</h2>
              <p className="text-body-sm text-on-surface-variant">Confirm AI analysis and add description.</p>
            </div>
          </div>

          {/* Image Preview */}
          <div className="w-full h-52 bg-surface-container-low rounded-2xl overflow-hidden mb-6 relative shadow-sm border border-outline-variant/20">
            {previewUrl && (
              <img src={previewUrl} alt="Captured Hazard" className="w-full h-full object-cover" />
            )}

            {/* Upload progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="w-48 bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-body-sm text-on-surface font-medium">Uploading to cloud... {uploadProgress}%</span>
              </div>
            )}

            {/* AI scanning overlay */}
            {detecting && !uploading && (
              <div className="absolute inset-0 bg-surface/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-body-sm text-on-surface font-medium">AI analyzing pixels...</span>
              </div>
            )}

            {/* AI scanned badge */}
            {aiResult && !uploading && !detecting && (
              <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-outline-variant/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">AI Scanned</span>
              </div>
            )}
          </div>

          {/* AI Result Card */}
          {(detecting || aiResult) && (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 mb-6 flex items-start gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

              {detecting ? (
                <div className="flex items-center gap-3 z-10 w-full">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0 animate-pulse">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">AI Severity Analysis</p>
                    <p className="text-body-md text-on-surface">Analyzing image for hazards...</p>
                  </div>
                </div>
              ) : aiResult && (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10 ${severityConfig.color}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{severityConfig.icon}</span>
                  </div>
                  <div className="z-10 flex-1">
                    <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">AI Severity Analysis</h4>
                    <p className="text-h3 font-h3 text-on-surface flex items-center gap-2">
                      {severity} Risk
                      {aiResult.confidence > 0 && (
                        <span className="text-body-sm font-normal text-on-surface-variant">({aiResult.confidence}% confidence)</span>
                      )}
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-1">{severityConfig.label}</p>
                    {aiResult.detected && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-1 bg-error-container/40 text-error px-2 py-0.5 rounded-full text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[14px]">crisis_alert</span>
                          {aiResult.count > 1 ? `${aiResult.count} Potholes Detected` : 'Pothole Detected'}
                        </div>
                        {aiResult.method === 'yolos-pothole-model' && (
                          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                            YOLOS AI Model
                          </div>
                        )}
                      </div>
                    )}
                    {!aiResult.detected && aiResult.method === 'yolos-pothole-model' && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-secondary-container/40 text-secondary px-2 py-0.5 rounded-full text-[11px] font-medium">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        No pothole found — clear road
                      </div>
                    )}

                  </div>
                </>
              )}
            </div>
          )}

          {/* GPS Location */}
          <div className="mb-4">
            <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Current Location</label>
            <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: gps ? "'FILL' 1" : "'FILL' 0" }}>location_on</span>
              <div className="flex-1 min-w-0">
                {gpsLoading ? (
                  <p className="text-body-sm text-on-surface-variant animate-pulse">Fetching GPS location...</p>
                ) : gps ? (
                  <>
                    <p className="text-body-md text-on-surface font-medium truncate">
                      {gps.fallback ? 'Mumbai, India (approximate)' : `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`}
                    </p>
                    <p className="text-caption text-on-surface-variant">
                      GPS Accuracy: {gps.accuracy === 9999 ? 'Approximate' : `±${Math.round(gps.accuracy)}m`}
                    </p>
                  </>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">{gpsError || 'Location not captured'}</p>
                )}
              </div>
              {!gpsLoading && (
                <button onClick={captureGPS} className="text-primary text-sm font-label-bold hover:underline shrink-0">
                  {gps ? 'Refresh' : 'Retry'}
                </button>
              )}
            </div>
            {gpsError && (
              <p className="text-caption text-error mt-1">{gpsError}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-8 flex-grow">
            <label className="text-label-bold font-bold text-on-surface block mb-3 uppercase tracking-wider text-xs">Short Description (Optional)</label>
            <textarea
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[120px] shadow-sm resize-none"
              placeholder="e.g., Right lane near the traffic light, very hard to see at night..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || detecting || !cloudinaryUrl}
            className="w-full bg-primary text-on-primary h-[56px] rounded-full font-label-bold text-lg shadow-[0_4px_14px_rgba(124,58,237,0.39)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Saving Report...
              </>
            ) : uploading ? (
              'Uploading Image...'
            ) : detecting ? (
              'AI Analyzing...'
            ) : (
              <>
                Submit Report
                <span className="material-symbols-outlined text-sm">send</span>
              </>
            )}
          </button>
        </main>
      )}

      {/* ── SUCCESS STEP ──────────────────────────────────────────────── */}
      {step === 'success' && (
        <main className="flex-grow w-full max-w-md mx-auto p-margin-mobile flex flex-col items-center pt-8 pb-32">
          <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(108,248,187,0.3)] animate-bounce-short">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>

          <h2 className="text-h1 font-h1 text-on-surface text-center mb-2">Report Submitted!</h2>
          <p className="text-body-md text-on-surface-variant text-center mb-6 px-4">
            You've earned <strong className="text-primary">+50 points</strong> for keeping the roads safe.
          </p>

          {/* Report Summary Card */}
          <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 mb-8 shadow-sm text-left">
            <h3 className="text-label-bold font-bold text-on-surface uppercase tracking-wider text-xs mb-4 border-b border-outline-variant/20 pb-2">Report Summary</h3>

            {previewUrl && (
              <div className="w-full h-32 rounded-xl overflow-hidden mb-4">
                <img src={previewUrl} alt="Reported hazard" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">AI Severity</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${severityConfig.dot}`}></span>
                  <p className="text-body-lg font-bold text-on-surface">{severity} Risk</p>
                  {aiResult?.confidence > 0 && (
                    <span className="text-caption text-on-surface-variant">({aiResult.confidence}% confidence)</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Location</p>
                <p className="text-body-sm text-on-surface">
                  {gps ? (gps.fallback ? 'Mumbai, India (approximate)' : `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`) : 'Unknown'}
                </p>
              </div>

              {description && (
                <div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Description</p>
                  <p className="text-body-md text-on-surface bg-surface p-3 rounded-lg border border-outline-variant/10">{description}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Timestamp</p>
                <p className="text-body-sm text-on-surface">{new Date().toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Status</p>
                <div className="inline-flex items-center gap-1 bg-secondary-container/40 text-secondary px-2 py-0.5 rounded-full text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  Pending Review
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleReset}
              className="w-full bg-primary-container text-on-primary-container h-[56px] rounded-full font-label-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              Report Another Hazard
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full bg-transparent border border-outline-variant/30 text-on-surface h-[56px] rounded-full font-label-bold hover:bg-surface-container transition-colors"
            >
              Back to Home
            </button>
          </div>
        </main>
      )}

      <BottomNavBar />
    </div>
  );
}
