import { useEffect, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import toast from 'react-hot-toast';
import { complaintService } from '../services/api';

const severityOptions = ['Pending', 'Low', 'Medium', 'High', 'Critical'];

const getStatusClasses = (status) => {
  if (status === 'Resolved') return 'bg-secondary-container text-secondary';
  if (status === 'In Progress') return 'bg-tertiary-container text-tertiary';
  if (status === 'Rejected') return 'bg-error-container text-error';
  return 'bg-surface-variant text-on-surface-variant';
};

const getSeverityClasses = (severity) => {
  if (severity === 'Critical') return 'text-error';
  if (severity === 'High') return 'text-tertiary';
  if (severity === 'Medium') return 'text-primary';
  if (severity === 'Low') return 'text-secondary';
  return 'text-on-surface-variant';
};

export default function Complaints() {
  const [activeTab, setActiveTab] = useState('new');
  const [roadName, setRoadName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Pending');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        const res = await complaintService.getComplaints();
        setComplaints(res.data);
      } catch (err) {
        console.error('[COMPLAINTS] Load error:', err);
        toast.error(err.response?.data?.message || 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleEvidenceChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setEvidenceFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearEvidence = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setEvidenceFile(null);
    setPreviewUrl('');
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location capture is not supported in this browser');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGpsLoading(false);
        toast.success('Location attached');
      },
      (err) => {
        console.warn('[COMPLAINTS] GPS error:', err.message);
        setGpsLoading(false);
        toast.error('Could not capture location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetForm = () => {
    setRoadName('');
    setDescription('');
    setSeverity('Pending');
    setGps(null);
    clearEvidence();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roadName.trim() || !description.trim()) {
      toast.error('Road name and complaint details are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('roadName', roadName.trim());
      formData.append('description', description.trim());
      formData.append('severity', severity);
      if (gps) {
        formData.append('latitude', gps.lat);
        formData.append('longitude', gps.lng);
      }
      if (evidenceFile) {
        formData.append('evidence', evidenceFile);
      }

      const res = await complaintService.createComplaint(formData);
      const complaint = res.data.complaint;
      setComplaints((current) => [complaint, ...current]);
      setExpandedId(complaint._id);
      toast.success(`Complaint filed: ${complaint.referenceId}`);
      resetForm();
      setActiveTab('track');
    } catch (err) {
      console.error('[COMPLAINTS] Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to file complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col relative antialiased">
      <TopAppBar />

      <main className="flex-grow w-full max-w-2xl mx-auto p-margin-mobile flex flex-col pt-8 pb-32">
        <div className="mb-6">
          <h2 className="text-h1 font-h1 text-on-surface mb-2">Road Complaints</h2>
          <p className="text-body-md text-on-surface-variant">Report bad road conditions directly to local authorities.</p>
        </div>

        <div className="flex bg-surface-variant rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 rounded-lg text-label-bold font-bold transition-colors ${activeTab === 'new' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            New Complaint
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2.5 rounded-lg text-label-bold font-bold transition-colors ${activeTab === 'track' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Track Status
          </button>
        </div>

        {activeTab === 'new' && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Road/Location Name</label>
              <input
                type="text"
                required
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. MG Road, Near City Mall"
                className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Issue Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {severityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSeverity(option)}
                    className={`h-11 rounded-xl border text-sm font-bold transition-colors ${
                      severity === option
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Photo Evidence (Optional)</label>
              {previewUrl ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface shadow-sm">
                  <img src={previewUrl} alt="Complaint evidence preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearEvidence}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface/90 text-on-surface shadow flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <div className="absolute left-3 bottom-3 right-3 bg-surface/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs font-bold text-on-surface truncate">
                    {evidenceFile?.name}
                  </div>
                </div>
              ) : (
                <div className="w-full bg-surface border border-outline-variant/30 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors relative cursor-pointer group shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleEvidenceChange(event.target.files?.[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                  </div>
                  <span className="text-label-bold font-bold text-on-surface">Upload Photo</span>
                  <span className="text-caption text-on-surface-variant">JPG, PNG up to 5MB</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-label-bold font-bold text-on-surface block mb-2 uppercase tracking-wider text-xs">Complaint Details</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue (e.g. huge craters, waterlogging, missing manhole cover)..."
                className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-body-md text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm min-h-[120px] resize-none"
              />
            </div>

            <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-primary">my_location</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">Attach GPS Location</p>
                <p className="text-xs text-on-surface-variant truncate">
                  {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (${Math.round(gps.accuracy)}m)` : 'Optional, but helps authorities locate the issue'}
                </p>
              </div>
              <button
                type="button"
                onClick={captureLocation}
                disabled={gpsLoading}
                className="px-3 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold disabled:opacity-60"
              >
                {gpsLoading ? '...' : gps ? 'Refresh' : 'Add'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary h-[56px] rounded-full font-label-bold text-lg shadow-[0_4px_14px_rgba(124,58,237,0.39)] hover:bg-primary-fixed-variant transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>Submit Complaint <span className="material-symbols-outlined text-sm">send</span></>
              )}
            </button>
          </form>
        )}

        {activeTab === 'track' && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-body-sm text-on-surface-variant">Loading complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">assignment</span>
                <p className="text-body-md text-on-surface-variant">No complaints submitted yet.</p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint._id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-3">
                      <span className="text-xs font-bold text-outline tracking-wider">
                        {complaint.referenceId} &bull; {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <h3 className="text-h3 font-h3 text-on-surface mt-1 truncate">{complaint.roadName}</h3>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide shrink-0 ${getStatusClasses(complaint.status)}`}>
                      {complaint.status}
                    </div>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed">{complaint.description}</p>

                  {complaint.evidenceUrl && (
                    <img src={complaint.evidenceUrl} alt="Complaint evidence" className="mt-4 w-full h-36 object-cover rounded-xl border border-outline-variant/20" />
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex-1">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Severity</p>
                      <p className={`text-sm font-bold ${getSeverityClasses(complaint.severity)}`}>{complaint.severity}</p>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)}
                      className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      {expandedId === complaint._id ? 'Hide Timeline' : 'View Timeline'}
                      <span className="material-symbols-outlined text-[16px]">{expandedId === complaint._id ? 'expand_less' : 'arrow_forward'}</span>
                    </button>
                  </div>

                  {expandedId === complaint._id && (
                    <div className="mt-4 bg-surface rounded-xl p-4 border border-outline-variant/20">
                      {(complaint.timeline?.length ? complaint.timeline : [{ status: complaint.status, note: 'Complaint submitted.', at: complaint.createdAt }]).map((item, idx, timeline) => (
                        <div key={`${complaint._id}-${idx}`} className="flex gap-3 pb-3 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary mt-1"></div>
                            {idx < timeline.length - 1 && <div className="w-px flex-1 bg-outline-variant/30 mt-1"></div>}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{item.status}</p>
                            <p className="text-xs text-on-surface-variant">{item.note}</p>
                            <p className="text-[10px] text-outline mt-1">{new Date(item.at || complaint.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <BottomNavBar />
    </div>
  );
}
