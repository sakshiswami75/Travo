import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import toast from 'react-hot-toast';
import { reportService } from '../services/api';
import axios from 'axios';

const SEVERITY_CONFIG = {
  Critical: { color: 'bg-error-container text-error', icon: 'emergency', dot: 'bg-error', label: 'Critical — Immediate danger. Deep structural damage.' },
  Dangerous: { color: 'bg-error-container text-error', icon: 'warning', dot: 'bg-error', label: 'Dangerous — Serious risk. High potential for accidents.' },
  High: { color: 'bg-tertiary-container text-tertiary', icon: 'priority_high', dot: 'bg-tertiary', label: 'High — Significant hazard. Needs urgent attention.' },
  Medium: { color: 'bg-surface-container-high text-on-surface', icon: 'info', dot: 'bg-outline', label: 'Medium — Moderate hazard. Drive with caution.' },
  Low: { color: 'bg-secondary-container text-secondary', icon: 'check_circle', dot: 'bg-secondary', label: 'Low — Minor issue. Low risk.' },
};

const HAZARD_TYPES = ['Pothole', 'Crack', 'Waterlogging', 'Construction', 'Accident', 'Missing Manhole', 'Traffic Block', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Dangerous'];

export default function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'track'

  // Report Form State
  const [step, setStep] = useState('select'); // 'select' | 'preview' | 'success'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [hazardType, setHazardType] = useState('Pothole');
  const [severityOverride, setSeverityOverride] = useState('');
  const [locationName, setLocationName] = useState('');

  // Upload & AI state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  // GPS state
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Tracking state
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch reports
  useEffect(() => {
    if (activeTab === 'track') {
      fetchMyReports();
    }
  }, [activeTab]);

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      const res = await reportService.getReports();
      setMyReports(res.data);
    } catch (err) {
      toast.error('Failed to load your reports');
    } finally {
      setLoadingReports(false);
    }
  };

  // GPS + Reverse Geocode
  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGps({ lat, lng, accuracy: pos.coords.accuracy });
        
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.data && res.data.display_name) {
            const shortName = res.data.display_name.split(',').slice(0, 3).join(',');
            setLocationName(shortName);
          }
        } catch (e) {
          console.warn('Reverse geocode failed', e);
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setGpsError('Location access denied. Please manually describe the location.');
        setGps({ lat: 19.0760, lng: 72.8777, accuracy: 9999, fallback: true });
        setLocationName('Mumbai, India (Approximate)');
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const handleFileSelected = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAiResult(null);
    setCloudinaryUrl(null);
    setStep('preview');
    captureGPS();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 12, 85));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const uploadRes = await reportService.uploadImage(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setCloudinaryUrl(uploadRes.data.imageUrl);
      setCloudinaryPublicId(uploadRes.data.publicId);

      setDetecting(true);
      const detectRes = await reportService.detectFile(formData);
      setAiResult(detectRes.data);
      
      // Auto-set severity if detected
      if (detectRes.data.detected && detectRes.data.severity) {
        setSeverityOverride(detectRes.data.severity === 'Critical' ? 'Dangerous' : detectRes.data.severity);
      } else {
        setSeverityOverride('Medium');
      }

    } catch (err) {
      clearInterval(progressInterval);
      const msg = err.response?.data?.message || 'Process failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      setDetecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!cloudinaryUrl) {
      toast.error('Please analyze the image first');
      return;
    }
    if (!gps) {
      toast.error('Location is required. Please allow GPS.');
      return;
    }
    if (!hazardType || !severityOverride) {
      toast.error('Please fill in all required fields (Hazard Type, Severity)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        imageUrl: cloudinaryUrl,
        imagePublicId: cloudinaryPublicId || '',
        latitude: gps.lat,
        longitude: gps.lng,
        locationName: locationName || `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
        hazardType,
        severity: severityOverride,
        confidence: aiResult?.confidence || 0,
        aiDetectionResult: aiResult || {},
        description,
      };

      const res = await reportService.createReport(payload);
      setSubmissionResult(res.data);
      toast.success('Report submitted successfully!');
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    setHazardType('Pothole');
    setSeverityOverride('');
    setLocationName('');
    setCloudinaryUrl(null);
    setCloudinaryPublicId(null);
    setAiResult(null);
    setSubmissionResult(null);
    setAiResult(null);
    setGps(null);
    setUploadProgress(0);
  };

  const isNotRoad = aiResult?.isRoad === false;
  
  return (
    <div className="bg-background text-on-background font-body-md min-h-[100dvh] flex flex-col relative antialiased">
      <TopAppBar 
        title={activeTab === 'track' ? "Track Status" : step !== 'select' ? "Hazard Analysis" : "Report & Track"} 
        showBack={step !== 'select' || activeTab !== 'report'}
        onBack={() => {
          if (step !== 'select') handleReset();
          else if (activeTab === 'track') setActiveTab('report');
        }}
      />

      {/* Tabs */}
      <div className="flex w-full bg-surface border-b border-outline-variant/20 pt-2 px-4 sticky top-[64px] z-[50]">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'report' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
        >
          New Report
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'track' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
        >
          Track Status
        </button>
      </div>

      {activeTab === 'report' ? (
        <>
          {step === 'select' && (
            <main className="flex-1 w-full max-w-md mx-auto p-margin-mobile flex flex-col pt-6 pb-24 overflow-y-auto">
              <div className="mb-stack-lg">
                <h2 className="text-h1 font-h1 text-on-surface mb-2">Report Hazard</h2>
                <p className="text-body-md text-on-surface-variant">Help keep our roads safe by reporting an issue with a photo.</p>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 shadow-sm mb-6">
                <h3 className="text-label-bold font-label-bold text-on-surface mb-4 uppercase tracking-widest text-xs">Upload Photo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square group shadow-sm cursor-pointer">
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center text-primary mb-1"><span className="material-symbols-outlined text-3xl">photo_camera</span></div>
                    <span className="text-sm font-bold">Take Photo</span>
                  </div>
                  <div className="relative bg-surface border border-outline-variant/30 hover:border-secondary/50 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-square group shadow-sm cursor-pointer">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <div className="w-14 h-14 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary mb-1"><span className="material-symbols-outlined text-3xl">photo_library</span></div>
                    <span className="text-sm font-bold">Gallery</span>
                  </div>
                </div>
              </div>
            </main>
          )}

          {step === 'preview' && (
            <main className="flex-1 w-full max-w-md mx-auto p-margin-mobile flex flex-col pt-6 pb-24 overflow-y-auto">
              <div className="flex items-center gap-4 mb-stack-lg">
                <button onClick={handleReset} className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
                <div>
                  <h2 className="text-h2 font-h2 text-on-surface">Review & Submit</h2>
                </div>
              </div>

              {/* Image Preview & AI */}
              <div className="w-full h-48 bg-surface-container-low rounded-2xl overflow-hidden mb-6 relative">
                {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" />}
                {uploading && (
                  <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-48 bg-surface-container-high rounded-full h-2"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                    <span className="text-body-sm font-medium text-on-surface">Uploading... {uploadProgress}%</span>
                  </div>
                )}
                {detecting && !uploading && (
                  <div className="absolute inset-0 bg-surface/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-body-sm font-medium">AI scanning image...</span>
                  </div>
                )}
                {aiResult && !uploading && !detecting && (
                  <div className="absolute top-3 right-3 bg-primary text-on-primary px-3 py-1 text-xs font-bold rounded-full">AI Scanned</div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-5 flex-1 pb-8">
                {/* Location */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Location</label>
                  <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <input type="text" value={locationName} onChange={e => setLocationName(e.target.value)} className="bg-transparent w-full outline-none text-sm font-medium text-on-surface" placeholder={gpsLoading ? "Fetching GPS..." : "Enter location name"} />
                    <button onClick={captureGPS} className="text-primary text-xs font-bold shrink-0">{gpsLoading ? '...' : 'Refresh'}</button>
                  </div>
                </div>

                {/* Hazard Type & Severity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Hazard Type</label>
                    <select value={hazardType} onChange={e => setHazardType(e.target.value)} className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-3 text-sm font-medium text-on-surface outline-none focus:border-primary">
                      {HAZARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Severity</label>
                    <select value={severityOverride} onChange={e => setSeverityOverride(e.target.value)} className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-3 text-sm font-medium text-on-surface outline-none focus:border-primary">
                      <option value="" disabled>Select...</option>
                      {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Description (Optional)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary resize-none" placeholder="Provide extra details..." />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto">
                {!aiResult && !uploading && !detecting ? (
                  <button onClick={handleAnalyze} className="w-full bg-secondary text-on-secondary h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                    Upload & Analyze Image <span className="material-symbols-outlined">auto_awesome</span>
                  </button>
                ) : isNotRoad ? (
                  <button onClick={handleReset} className="w-full bg-error text-on-error h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                    Invalid Photo - Retry <span className="material-symbols-outlined">restart_alt</span>
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-on-primary h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-60">
                    {submitting ? <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" /> : 'Submit Complaint'}
                  </button>
                )}
              </div>
            </main>
          )}

          {step === 'success' && (
            <main className="flex-1 w-full max-w-md mx-auto p-margin-mobile flex flex-col items-center pt-8 pb-24">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h2 className="text-2xl font-black text-on-surface mb-1">Complaint Forwarded!</h2>
              <p className="text-center text-on-surface-variant mb-6 px-4 text-sm font-medium">
                Sent to {submissionResult?.municipality || 'Local Municipality'}. A live hazard marker has been added to the map.
              </p>

              {submissionResult?.rewardEarned > 0 && (
                <div className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-8 flex items-center gap-4 animate-[pulse_2s_ease-in-out_infinite]">
                  <div className="w-12 h-12 bg-yellow-500 text-yellow-900 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">stars</span>
                  </div>
                  <div>
                    <h3 className="text-yellow-600 font-bold uppercase tracking-wider text-xs mb-1">Civic Reward</h3>
                    <p className="text-on-surface font-black text-lg">You earned {submissionResult.rewardEarned} Points</p>
                  </div>
                </div>
              )}
              
              <button onClick={() => { setActiveTab('track'); handleReset(); }} className="w-full bg-primary text-on-primary h-14 rounded-xl font-bold mb-4 shadow-md transition-transform hover:-translate-y-1">
                Track Status
              </button>
              <button onClick={() => navigate('/map')} className="w-full bg-surface-container border border-outline-variant/30 text-on-surface h-14 rounded-xl font-bold hover:bg-surface-container-high transition-colors">
                View on Map
              </button>
            </main>
          )}
        </>
      ) : (
        <main className="flex-1 w-full max-w-md mx-auto p-margin-mobile pt-6 pb-24 overflow-y-auto bg-surface-variant/20">
          <h2 className="text-xl font-bold mb-6 text-on-surface px-1">My Reports</h2>
          {loadingReports ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : myReports.length === 0 ? (
            <div className="text-center text-on-surface-variant py-10">You haven't reported any hazards yet.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {myReports.map(report => (
                <div key={report._id} className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm flex flex-col mb-4">
                  <div className="flex gap-4 p-4">
                    <div className="relative shrink-0">
                      <img src={report.imageUrl} alt="Hazard" className="w-20 h-20 rounded-xl object-cover bg-surface-container" />
                      {report.rewardEarned > 0 && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-yellow-400">
                          <span className="material-symbols-outlined text-[10px]">stars</span>
                          {report.rewardEarned}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-black tracking-wider uppercase text-on-surface-variant truncate pr-2">{report.hazardType || 'Pothole'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          report.status === 'Resolved' ? 'bg-green-500/20 text-green-500' :
                          report.status === 'Sent to Municipality' ? 'bg-blue-500/20 text-blue-500' :
                          report.status === 'In Progress' ? 'bg-orange-500/20 text-orange-500' :
                          report.status === 'Verified' ? 'bg-purple-500/20 text-purple-500' :
                          'bg-yellow-500/20 text-yellow-600'
                        }`}>{report.status}</span>
                      </div>
                      <h4 className="font-bold text-on-surface text-sm truncate">{report.locationName || 'Unknown Location'}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 mb-2 truncate">{new Date(report.createdAt).toLocaleDateString()} • {report.severity} Severity</p>
                      
                      <div className="flex flex-col gap-1 mt-2 bg-surface-container-low rounded-lg p-2 border border-outline-variant/20">
                        <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">account_balance</span>
                          <span className="truncate">{report.municipality || 'Pending Assignment'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold">
                          <span className="material-symbols-outlined text-[14px]">groups</span>
                          {report.verificationCount || 0} Crowd Verifications
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      <BottomNavBar />
    </div>
  );
}
