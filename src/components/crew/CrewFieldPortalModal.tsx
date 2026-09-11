import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CrewMember, CrewWorkHourLog, VendorBooking, CrewAttendanceRecord } from '../../types';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Coffee,
  X,
  Plus,
  AlertTriangle,
  Send,
  Navigation,
  FileCheck,
  Radio,
  Target,
  RefreshCw,
  Award,
  Compass,
  FileText,
  Check,
  Info,
  Sliders,
  Bell,
  Smartphone,
} from 'lucide-react';

interface CrewFieldPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewMembers: CrewMember[];
  bookings?: VendorBooking[];
  onAddWorkLog?: (crewId: string, log: CrewWorkHourLog) => void;
  onUpdateCrewStatus?: (crewId: string, newStatus: CrewMember['status']) => void;
}

// Precision Haversine Distance in meters
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Play arrival sound chime using Web Audio API
function playArrivalChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.75);
  } catch (e) {
    // AudioContext not allowed before user gesture or unavailable
  }
}

export const CrewFieldPortalModal: React.FC<CrewFieldPortalModalProps> = ({
  isOpen,
  onClose,
  crewMembers,
  bookings = [],
  onAddWorkLog,
  onUpdateCrewStatus,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'gps_attendance' | 'checklist' | 'work_logs' | 'audit_records'>('gps_attendance');
  const [selectedCrewId, setSelectedCrewId] = useState<string>(crewMembers[0]?.id || '');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || 'vb-101');
  
  // Geolocation State
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'active' | 'error' | 'denied'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [isLiveWatching, setIsLiveWatching] = useState<boolean>(true);
  const [autoCheckInEnabled, setAutoCheckInEnabled] = useState<boolean>(true);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(200); // 200 meters

  // Current Device / Simulated Location (Default coordinates around Riyadh)
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
    isSimulated?: boolean;
  }>({
    lat: 24.7335,
    lng: 46.5922,
    accuracy: 8,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
    isSimulated: true,
  });

  // Clock in status per crew member
  const [clockedInState, setClockedInState] = useState<
    Record<
      string,
      {
        isClockedIn: boolean;
        checkInTime: string;
        checkInCoords: { lat: number; lng: number; accuracy: number };
        bookingId: string;
        bookingTitle: string;
        venueName: string;
        geofenceVerified: boolean;
      }
    >
  >({
    'crew-1': {
      isClockedIn: true,
      checkInTime: new Date(Date.now() - 3.5 * 3600 * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      checkInCoords: { lat: 24.7336, lng: 46.5921, accuracy: 6 },
      bookingId: 'vb-101',
      bookingTitle: 'ركن الضيافة النجدية الملكية',
      venueName: 'قاعة نيارة - الدرعية',
      geofenceVerified: true,
    },
  });

  // Attendance Records History
  const [attendanceHistory, setAttendanceHistory] = useState<CrewAttendanceRecord[]>([
    {
      id: 'att-101',
      crewId: 'crew-1',
      crewName: 'سعد المنصور',
      bookingId: 'vb-101',
      bookingNumber: 'BK-2026-0881',
      eventTitle: 'ركن الضيافة النجدية الملكية (قاعة نيارة)',
      venueName: 'قاعة نيارة - الدرعية، الرياض',
      checkInTime: '2026-08-22 16:30:12',
      checkInCoordinates: { lat: 24.7335, lng: 46.5922, accuracy: 5 },
      checkOutTime: '2026-08-22 22:30:45',
      checkOutCoordinates: { lat: 24.7334, lng: 46.5923, accuracy: 6 },
      geofenceStatus: 'verified_inside',
      distanceToVenueMeters: 14,
      durationMinutes: 360,
      autoTriggered: true,
      notes: 'تم التحقق الجغرافي التلقائي عند مدخل القاعة الرئيسي',
    },
    {
      id: 'att-102',
      crewId: 'crew-2',
      crewName: 'عبدالرحمن العتيبي',
      bookingId: 'vb-101',
      bookingNumber: 'BK-2026-0881',
      eventTitle: 'ركن الضيافة النجدية الملكية (قاعة نيارة)',
      venueName: 'قاعة نيارة - الدرعية، الرياض',
      checkInTime: '2026-08-22 16:45:00',
      checkInCoordinates: { lat: 24.7337, lng: 46.5920, accuracy: 8 },
      checkOutTime: '2026-08-22 22:45:00',
      checkOutCoordinates: { lat: 24.7336, lng: 46.5921, accuracy: 7 },
      geofenceStatus: 'verified_inside',
      distanceToVenueMeters: 38,
      durationMinutes: 360,
      autoTriggered: true,
      notes: 'حضور مباشر بالزي التراثي والدلال الذهبية',
    },
  ]);

  // Checklists
  const [checklists, setChecklists] = useState<Record<string, boolean>>({
    uniform: true,
    equipment: true,
    hygiene: true,
    timing: true,
  });

  // Manual Log Hours Modal
  const [logHoursModal, setLogHoursModal] = useState(false);
  const [regHours, setRegHours] = useState(5);
  const [otHours, setOtHours] = useState(1);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  // Watch position ref
  const watchIdRef = useRef<number | null>(null);

  const currentMember = crewMembers.find((c) => c.id === selectedCrewId) || crewMembers[0];
  
  // Selected Booking for Geofence calculation
  const targetBooking = useMemo(() => {
    return (
      bookings.find((b) => b.id === selectedBookingId) ||
      bookings[0] || {
        id: '',
        bookingNumber: '',
        serviceTitle: '',
        venueName: '',
        date: '',
        startTime: '',
        endTime: '',
        venueCoordinates: {
          lat: 0,
          lng: 0,
          addressText: '',
          geofenceRadiusMeters: 200,
        },
      }
    );
  }, [bookings, selectedBookingId]);

  const targetCoords = targetBooking.venueCoordinates || {
    lat: 0,
    lng: 0,
    addressText: '',
    geofenceRadiusMeters: 200,
  };

  // Calculate distance between current crew GPS position and target booking venue
  const distanceToVenue = useMemo(() => {
    return calculateHaversineDistance(
      currentCoords.lat,
      currentCoords.lng,
      targetCoords.lat,
      targetCoords.lng
    );
  }, [currentCoords.lat, currentCoords.lng, targetCoords.lat, targetCoords.lng]);

  const isInsideGeofence = distanceToVenue <= geofenceRadius;
  const isApproaching = distanceToVenue > geofenceRadius && distanceToVenue <= 800;

  // Real Browser GeoLocation Fetcher
  const acquireRealGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('خاصية تحديد الموقع الجغرافي (GeoLocation) غير مدعومة في هذا المتصفح.');
      return;
    }

    setGpsStatus('locating');
    setGpsErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
          isSimulated: false,
        });
        setGpsStatus('active');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setGpsErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? 'تم رفض إذن الوصول للموقع في المتصفح. يمكنك تفعيل الإذن من إعدادات المتصفح أو استخدام المحاكاة الميدانية للتجربة.'
            : 'تعذر الاتصال بأقمار الـ GPS، تم التبديل لوضع المحاكاة الميدانية.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Start / Stop Live GPS Tracking watcher
  useEffect(() => {
    if (!isLiveWatching || !navigator.geolocation) return;

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
            isSimulated: false,
          });
          setGpsStatus('active');
          setGpsErrorMsg(null);
        },
        (err) => {
          // If error in watch, fallback gracefully without blocking UI
          if (gpsStatus !== 'denied') {
            setGpsStatus('active');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000,
        }
      );
      watchIdRef.current = id;
    } catch (e) {
      console.warn(e);
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isLiveWatching]);

  // Automatic Check-In detection when entering Geofence
  useEffect(() => {
    if (!autoCheckInEnabled || !currentMember || !targetBooking) return;

    const memberClockState = clockedInState[currentMember.id];
    const isClocked = memberClockState?.isClockedIn;

    // Trigger auto check-in if within geofence and not clocked in
    if (isInsideGeofence && !isClocked) {
      handleClockIn(currentMember.id, true);
    }
  }, [isInsideGeofence, autoCheckInEnabled, currentMember?.id]);

  // Handle Clock In (Manual or Auto)
  const handleClockIn = (crewId: string, isAuto: boolean = false) => {
    const timeString = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const fullIso = new Date().toISOString();

    setClockedInState((prev) => ({
      ...prev,
      [crewId]: {
        isClockedIn: true,
        checkInTime: timeString,
        checkInCoords: {
          lat: currentCoords.lat,
          lng: currentCoords.lng,
          accuracy: currentCoords.accuracy,
        },
        bookingId: targetBooking.id,
        bookingTitle: targetBooking.serviceTitle,
        venueName: targetBooking.venueName,
        geofenceVerified: isInsideGeofence,
      },
    }));

    if (onUpdateCrewStatus) {
      onUpdateCrewStatus(crewId, 'on_mission');
    }

    // Play arrival audio chime
    playArrivalChime();

    // Show toast
    setShowSuccessToast({
      show: true,
      msg: isAuto
        ? `📍 تم تسجيل حضورك التلقائي عبر السياج الجغرافي في: ${targetBooking.venueName}`
        : `✅ تم تسجيل الحضور الموثق بالـ GPS للمباشر: ${currentMember.name}`,
    });
    setTimeout(() => setShowSuccessToast({ show: false, msg: '' }), 4500);
  };

  // Handle Clock Out
  const handleClockOut = (crewId: string) => {
    const clockData = clockedInState[crewId];
    if (!clockData) return;

    const timeString = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const fullDate = new Date().toISOString().split('T')[0];

    // Compute duration (estimate 5 hours or based on session)
    const estimatedHours = 5;
    const rate = currentMember.hourlyRate || 65;
    const totalPay = estimatedHours * rate;

    // Create Attendance Record
    const newRecord: CrewAttendanceRecord = {
      id: `att-${Date.now()}`,
      crewId,
      crewName: currentMember.name,
      bookingId: clockData.bookingId,
      bookingNumber: targetBooking.bookingNumber || 'BK-2026-AUTO',
      eventTitle: clockData.bookingTitle,
      venueName: clockData.venueName,
      checkInTime: `${fullDate} ${clockData.checkInTime}`,
      checkInCoordinates: clockData.checkInCoords,
      checkOutTime: `${fullDate} ${timeString}`,
      checkOutCoordinates: {
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        accuracy: currentCoords.accuracy,
      },
      geofenceStatus: clockData.geofenceVerified ? 'verified_inside' : 'manual_override',
      distanceToVenueMeters: distanceToVenue,
      durationMinutes: estimatedHours * 60,
      autoTriggered: autoCheckInEnabled,
      notes: `انصراف موثق بنظام السياج الجغرافي GPS (${distanceToVenue}م من الموقع)`,
    };

    setAttendanceHistory((prev) => [newRecord, ...prev]);

    // Also auto-sync with Work Log for payroll!
    if (onAddWorkLog) {
      const newWorkLog: CrewWorkHourLog = {
        id: `log-${Date.now()}`,
        crewId,
        crewName: currentMember.name,
        bookingId: clockData.bookingId,
        eventTitle: `${clockData.bookingTitle} - ${clockData.venueName}`,
        eventDate: fullDate,
        regularHours: estimatedHours,
        overtimeHours: 0,
        hourlyRate: rate,
        overtimeRate: rate * 1.5,
        totalEarned: totalPay,
        status: 'unprocessed',
        notes: `حضور معتمد جغرافياً بالـ GPS (سياج ${geofenceRadius}م) - يوصل الميداني`,
        recordedAt: new Date().toISOString(),
      };
      onAddWorkLog(crewId, newWorkLog);
    }

    setClockedInState((prev) => ({
      ...prev,
      [crewId]: {
        ...prev[crewId],
        isClockedIn: false,
      },
    }));

    if (onUpdateCrewStatus) {
      onUpdateCrewStatus(crewId, 'available');
    }

    setShowSuccessToast({
      show: true,
      msg: `🏁 تم توثيق انصراف ${currentMember.name} وترحيل ساعات المناوبة (${estimatedHours} ساعات) لمسير الأجور!`,
    });
    setTimeout(() => setShowSuccessToast({ show: false, msg: '' }), 4500);
  };

  // Location Simulator Presets for testing
  const setSimulatedLocation = (preset: 'inside' | 'approaching' | 'outside') => {
    if (preset === 'inside') {
      // 45 meters from venue
      setCurrentCoords({
        lat: targetCoords.lat + 0.00025,
        lng: targetCoords.lng + 0.00025,
        accuracy: 6,
        speed: 0,
        heading: 45,
        timestamp: Date.now(),
        isSimulated: true,
      });
      setGpsStatus('active');
    } else if (preset === 'approaching') {
      // 480 meters away
      setCurrentCoords({
        lat: targetCoords.lat + 0.0035,
        lng: targetCoords.lng + 0.003,
        accuracy: 12,
        speed: 38,
        heading: 180,
        timestamp: Date.now(),
        isSimulated: true,
      });
      setGpsStatus('active');
    } else {
      // 4.2 km away
      setCurrentCoords({
        lat: targetCoords.lat + 0.035,
        lng: targetCoords.lng + 0.03,
        accuracy: 25,
        speed: 75,
        heading: 270,
        timestamp: Date.now(),
        isSimulated: true,
      });
      setGpsStatus('active');
    }
  };

  // Manual save hours form
  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember || !onAddWorkLog) return;

    const rate = currentMember.hourlyRate || 65;
    const newLog: CrewWorkHourLog = {
      id: `log-${Date.now()}`,
      crewId: currentMember.id,
      crewName: currentMember.name,
      eventTitle,
      eventDate,
      regularHours: Number(regHours),
      overtimeHours: Number(otHours),
      hourlyRate: rate,
      overtimeRate: rate * 1.5,
      totalEarned: Number(regHours) * rate + Number(otHours) * (rate * 1.5),
      status: 'unprocessed',
      recordedAt: new Date().toISOString(),
      notes: logNotes || 'توثيق مناوبة ميدانية موثقة من بوابة المباشرين',
    };

    onAddWorkLog(currentMember.id, newLog);
    setLogHoursModal(false);
    setShowSuccessToast({
      show: true,
      msg: 'تم توثيق ساعات العمل بنجاح وترحيلها لمسير الأجور المعتمد!',
    });
    setTimeout(() => setShowSuccessToast({ show: false, msg: '' }), 3500);
  };

  const currentMemberClock = clockedInState[currentMember?.id || ''];
  const isMemberClockedIn = !!currentMemberClock?.isClockedIn;

  return (
    <div
      id="crew-field-portal-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 md:p-6 text-right font-sans"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-l from-[#0A1A33] via-[#0F284D] to-[#155EEF] text-white relative overflow-hidden flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#C0A16B]/20 border border-[#C0A16B]/40 flex items-center justify-center text-[#C0A16B] shadow-inner">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/20 text-[#C0A16B] font-mono tracking-wider">
                  GPS GEOFENCE OS
                </span>
                <span className="text-xs text-white/80 font-medium hidden sm:inline">
                  بوابة الطاقم الميداني والحضور الذكي
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white mt-0.5 flex items-center gap-2">
                <span>تتبع موقع المندوبين والحضور التلقائي بالـ GPS</span>
              </h2>
            </div>
          </div>

          <button
            id="close-crew-portal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Selector Strip */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-xs text-slate-500 font-bold shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>اختر المباشر/المشرف:</span>
          </span>
          {crewMembers.map((member) => {
            const isClocked = clockedInState[member.id]?.isClockedIn;
            return (
              <button
                key={member.id}
                onClick={() => setSelectedCrewId(member.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentMember?.id === member.id
                    ? 'bg-[#155EEF] text-white shadow-xs scale-102'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{member.name}</span>
                <span className="text-[10px] opacity-80">({member.role})</span>
                {isClocked && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Tabs Strip */}
        <div className="flex border-b border-slate-200 bg-white px-3 sm:px-6 gap-2 sm:gap-4 overflow-x-auto shrink-0">
          <button
            id="tab-gps-attendance"
            onClick={() => setActiveTab('gps_attendance')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'gps_attendance'
                ? 'border-[#155EEF] text-[#155EEF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>تتبع الـ GPS والسياج الجغرافي</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              تلقائي
            </span>
          </button>

          <button
            id="tab-checklist"
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-[#155EEF] text-[#155EEF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>قائمة الفحص والمظهر المعتمد</span>
          </button>

          <button
            id="tab-work-logs"
            onClick={() => setActiveTab('work_logs')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'work_logs'
                ? 'border-[#155EEF] text-[#155EEF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ساعات المناوبة والأجور</span>
          </button>

          <button
            id="tab-audit-records"
            onClick={() => setActiveTab('audit_records')}
            className={`py-3 px-2 sm:px-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit_records'
                ? 'border-[#155EEF] text-[#155EEF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>سجل الحضور المعتمد بالـ GPS ({attendanceHistory.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 bg-slate-50/50">
          
          {/* Toast Banner */}
          {showSuccessToast.show && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span className="flex-1">{showSuccessToast.msg}</span>
            </div>
          )}

          {/* TAB 1: GPS Live Tracking & Geofence Automated Attendance */}
          {activeTab === 'gps_attendance' && (
            <div className="space-y-6">
              
              {/* Active Booking Target Selector Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#155EEF] bg-blue-50 px-2 py-0.5 rounded-md">
                      المناسبة الميدانية المخصصة
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                      {targetBooking.serviceTitle} ({targetBooking.bookingNumber})
                    </h3>
                  </div>

                  {bookings.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">تغيير المناسبة:</span>
                      <select
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        {bookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.venueName} - {b.date}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">موقع الفعالية:</span>
                      <span className="font-bold text-slate-900">{targetBooking.venueName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Calendar className="w-4 h-4 text-[#155EEF] shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">الموعد والتوقيت:</span>
                      <span className="font-bold text-slate-900">
                        {targetBooking.date} ({targetBooking.startTime || '17:00'} - {targetBooking.endTime || '22:00'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <Target className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">نطاق السياج الجغرافي:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        دائرة نصف قطرها {geofenceRadius} متر
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geofence Radar & Proximity Status Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0A1A33] to-[#0d2242] text-white border border-slate-800 shadow-xl overflow-hidden relative">
                
                {/* Radar Grid Graphic background */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#155EEF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                  
                  {/* Left: Interactive Radar SVG View */}
                  <div className="w-full lg:w-72 flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      
                      {/* Outer Pulse Ring */}
                      <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping opacity-30" />
                      
                      {/* 200m Geofence Ring */}
                      <div
                        className={`absolute inset-4 rounded-full border-2 border-dashed transition-colors ${
                          isInsideGeofence ? 'border-emerald-400 bg-emerald-500/10' : 'border-blue-400/40 bg-blue-500/5'
                        }`}
                      />
                      
                      {/* Inner 50m Ring */}
                      <div className="absolute inset-14 rounded-full border border-blue-400/20" />

                      {/* Center Target Venue Pin */}
                      <div className="relative z-20 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-rose-200 mt-1 bg-black/60 px-1.5 py-0.2 rounded font-sans">
                          موقع المناسبة
                        </span>
                      </div>

                      {/* Live Crew Pin positioned based on proximity */}
                      <div
                        className={`absolute transition-all duration-700 z-30 flex flex-col items-center ${
                          isInsideGeofence
                            ? 'translate-x-5 -translate-y-4'
                            : isApproaching
                            ? 'translate-x-16 -translate-y-12'
                            : 'translate-x-20 -translate-y-20'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform ${
                            isInsideGeofence
                              ? 'bg-emerald-500 text-white animate-bounce'
                              : isApproaching
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] font-bold text-white bg-slate-900/80 px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap">
                          {currentMember.name.split(' ')[0]}
                        </span>
                      </div>

                      {/* Connecting Radar Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line
                          x1="50%"
                          y1="50%"
                          x2={isInsideGeofence ? '60%' : isApproaching ? '75%' : '90%'}
                          y2={isInsideGeofence ? '42%' : isApproaching ? '30%' : '15%'}
                          stroke={isInsideGeofence ? '#10B981' : isApproaching ? '#F59E0B' : '#EF4444'}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                      </svg>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="text-[11px] font-bold text-white/70">المسافة الحالية عن الفعالية:</span>
                      <div className="text-base font-black text-white font-mono flex items-center justify-center gap-1.5">
                        <span className={isInsideGeofence ? 'text-emerald-400' : isApproaching ? 'text-amber-400' : 'text-rose-400'}>
                          {distanceToVenue < 1000 ? `${distanceToVenue} متر` : `${(distanceToVenue / 1000).toFixed(1)} كم`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Telemetry & Smart Action Controls */}
                  <div className="flex-1 space-y-4 w-full">
                    
                    {/* Status Badge Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                        isInsideGeofence
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                          : isApproaching
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          isInsideGeofence ? 'bg-emerald-600' : isApproaching ? 'bg-amber-600' : 'bg-rose-600'
                        }`}
                      >
                        {isInsideGeofence ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isApproaching ? (
                          <Radio className="w-5 h-5 animate-pulse" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-xs font-black">
                          {isInsideGeofence
                            ? '🟢 أنت الآن داخل موقع المناسبة (السياج الجغرافي نشط)'
                            : isApproaching
                            ? '🟡 أنت تقترب من موقع المناسبة (أقل من 800 متر)'
                            : '🔴 أنت خارج النطاق الجغرافي المخصص للمناسبة'}
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed">
                          {isInsideGeofence
                            ? 'تم التحقق من إحداثيات تواجدك بنجاح. يمكنك تسجيل الحضور الفوري أو الاعتماد على الحضور التلقائي.'
                            : isApproaching
                            ? 'يرجى متابعة التوجه لمقر القاعة لتأكيد وصول المباشرين وتجهيز الدلال والضيافة.'
                            : 'يلزم التواجد ضمن نطاق 200 متر من القاعة لتفعيل تسجيل الحضور الذكي المعتمد.'}
                        </p>
                      </div>
                    </div>

                    {/* Telemetry Numbers Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-white/50 block font-sans">خط العرض (Lat)</span>
                        <span className="font-bold text-white text-[11px]">{currentCoords.lat.toFixed(5)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-white/50 block font-sans">خط الطول (Lng)</span>
                        <span className="font-bold text-white text-[11px]">{currentCoords.lng.toFixed(5)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-white/50 block font-sans">دقة الإشارة</span>
                        <span className="font-bold text-emerald-400 text-[11px]">±{currentCoords.accuracy}م</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-white/50 block font-sans">مصدر الإشارة</span>
                        <span className="font-bold text-[#C0A16B] text-[11px]">
                          {currentCoords.isSimulated ? 'محاكاة GPS' : 'موقع المتصفح الحي'}
                        </span>
                      </div>
                    </div>

                    {/* Auto Check-in Toggle & Action Buttons */}
                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoCheckInEnabled}
                          onChange={(e) => setAutoCheckInEnabled(e.target.checked)}
                          className="w-4 h-4 text-[#155EEF] rounded focus:ring-0"
                        />
                        <div>
                          <span className="text-xs font-black text-white block">
                            تفعيل الحضور التلقائي عند دخول السياج الجغرافي (Auto Check-In)
                          </span>
                          <span className="text-[10px] text-white/60">
                            تسجيل الحضور أوتوماتيكياً فور وصول المباشر لمحيط 200م
                          </span>
                        </div>
                      </label>

                      {/* Main Clock-In / Clock-Out Action Button */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {!isMemberClockedIn ? (
                          <button
                            id="btn-clock-in-gps"
                            onClick={() => handleClockIn(currentMember.id, false)}
                            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                              isInsideGeofence
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-102'
                                : 'bg-slate-700 hover:bg-slate-600 text-white/90'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            <span>تسجيل حضور GPS (Clock In)</span>
                          </button>
                        ) : (
                          <button
                            id="btn-clock-out-gps"
                            onClick={() => handleClockOut(currentMember.id)}
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                          >
                            <Clock className="w-4 h-4" />
                            <span>تسجيل انصراف وترحيل الساعات (Clock Out)</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Simulation & GPS Diagnostic Bar */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={acquireRealGPS}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="قراءة إحداثيات GPS الحقيقية من متصفحك الحالي"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#C0A16B]" />
                      <span>تحديث GPS المتصفح الفعلي</span>
                    </button>

                    {gpsErrorMsg && (
                      <span className="text-[10px] text-amber-300 font-medium">
                        {gpsErrorMsg}
                      </span>
                    )}
                  </div>

                  {/* Simulator buttons for testing all 3 states */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/60 font-bold">محاكاة التجربة:</span>
                    <button
                      onClick={() => setSimulatedLocation('inside')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      📍 وصول للموقع (داخل 45م)
                    </button>
                    <button
                      onClick={() => setSimulatedLocation('approaching')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/30 transition-colors cursor-pointer"
                    >
                      🚕 في الطريق (480م)
                    </button>
                    <button
                      onClick={() => setSimulatedLocation('outside')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] border border-rose-500/30 transition-colors cursor-pointer"
                    >
                      🏢 خارج النطاق (4.2 كم)
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Member Status & Active Mission Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {currentMember.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{currentMember.name}</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {currentMember.role}
                      </span>
                      {isMemberClockedIn ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>في مناوبة نشطة (حاضر بالـ GPS)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          جاهز للتكليف
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      الأجر بالساعة: <strong className="text-slate-900">{currentMember.hourlyRate || 65} ر.س/س</strong> | إجمالي الساعات المعتمدة: {currentMember.totalLoggedHours || 0} ساعة
                    </p>
                  </div>
                </div>

                {isMemberClockedIn && currentMemberClock && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 w-full sm:w-auto">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>حضور موثق في: {currentMemberClock.venueName}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono">
                      وقت تسجيل الحضور: {currentMemberClock.checkInTime} • السياج الجغرافي: معتمد
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Quality & Uniform Checklist */}
          {activeTab === 'checklist' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#155EEF]" />
                    <span>قائمة الفحص الميداني والمظهر المعتمد (Uniform & Quality Checklist)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    التحقق الإلزامي من الجاهزية قبل بدء مراسم الضيافة السعودية الرسمية
                  </p>
                </div>
                <span className="text-xs text-emerald-700 font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
                  معايير الضيافة السعودية اليوصلة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={checklists.uniform}
                    onChange={(e) => setChecklists({ ...checklists, uniform: e.target.checked })}
                    className="w-4 h-4 text-[#155EEF] rounded-md focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">الزي الموحد (ثوب سعودي مكوي + سديري مطرز أنيق)</span>
                    <span className="text-[11px] text-slate-500">مظهر راقٍ يتوافق مع هوية الفخامة السعودية</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={checklists.equipment}
                    onChange={(e) => setChecklists({ ...checklists, equipment: e.target.checked })}
                    className="w-4 h-4 text-[#155EEF] rounded-md focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">جاهزية عتاد الدلال وفناجيل السيراميك والمباخر</span>
                    <span className="text-[11px] text-slate-500">نظافة وتعقيم الدلال النحاسية والمباخر الملكية</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={checklists.hygiene}
                    onChange={(e) => setChecklists({ ...checklists, hygiene: e.target.checked })}
                    className="w-4 h-4 text-[#155EEF] rounded-md focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">القفازات والكمامات والنظافة الشخصية التامة</span>
                    <span className="text-[11px] text-slate-500">الالتزام بأعلى معايير السلامة والصحة الغذائية</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={checklists.timing}
                    onChange={(e) => setChecklists({ ...checklists, timing: e.target.checked })}
                    className="w-4 h-4 text-[#155EEF] rounded-md focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">الوصول قبل موعد المناسبة بـ 60 دقيقة للترتيب</span>
                    <span className="text-[11px] text-slate-500">إعداد القهوة وبخور العود قبل استقبال أول الضيوف</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Work Logs & Payroll Timesheets */}
          {activeTab === 'work_logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    سجل المناوبات وساعات العمل: {currentMember.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    توثيق الساعات المنجزة والمرحلة لمسير الأجور المعتمد
                  </p>
                </div>

                <button
                  onClick={() => setLogHoursModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>توثيق مناوبة يدوياً</span>
                </button>
              </div>

              {/* Log Hours Form Modal if opened */}
              {logHoursModal && (
                <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <h4 className="text-xs font-black text-slate-900">
                      توثيق ساعات عمل المناوبة: {currentMember.name}
                    </h4>
                    <button
                      onClick={() => setLogHoursModal(false)}
                      className="text-xs text-slate-500 font-bold hover:text-slate-900"
                    >
                      إلغاء
                    </button>
                  </div>

                  <form onSubmit={handleSaveHours} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          عنوان المناسبة / الفعالية
                        </label>
                        <input
                          type="text"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          تاريخ المناسبة
                        </label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          الساعات الأساسية
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={regHours}
                          onChange={(e) => setRegHours(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          الساعات الإضافية (1.5×)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          value={otHours}
                          onChange={(e) => setOtHours(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        ملاحظات المشرف
                      </label>
                      <input
                        type="text"
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="تفاصيل الحضور والأداء الميداني..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-blue-900">
                        الإجمالي المستحق:{' '}
                        {(
                          regHours * (currentMember.hourlyRate || 65) +
                          otHours * (currentMember.hourlyRate || 65) * 1.5
                        ).toLocaleString('ar-SA')}{' '}
                        ر.س
                      </span>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#155EEF] hover:bg-[#0F45B5] text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        حفظ وترحيل لمسير الرواتب
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Work logs list */}
              {currentMember.workLogs && currentMember.workLogs.length > 0 ? (
                <div className="space-y-2.5">
                  {currentMember.workLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs gap-4"
                    >
                      <div className="space-y-1">
                        <div className="font-black text-slate-900 text-sm">{log.eventTitle}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                          <span>{log.eventDate}</span>
                          <span>•</span>
                          <span>{log.regularHours} س أساسية</span>
                          {log.overtimeHours > 0 && (
                            <>
                              <span>+</span>
                              <span className="text-amber-600 font-bold">{log.overtimeHours} س إضافية</span>
                            </>
                          )}
                        </div>
                        {log.notes && <p className="text-[10px] text-slate-400">{log.notes}</p>}
                      </div>

                      <div className="text-left shrink-0">
                        <div className="font-black text-emerald-700 font-mono text-sm">
                          {log.totalEarned.toLocaleString('ar-SA')} ر.س
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-block mt-1">
                          معتمد في المسير
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  لا توجد مناوبات مسجلة لهذا العضو حتى الآن.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GPS Attendance Audit Records */}
          {activeTab === 'audit_records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    سجل الحضور والانصراف المعتمد جغرافياً (GPS Verified Log)
                  </h4>
                  <p className="text-xs text-slate-500">
                    كشوف الحضور الموثقة بدقة الأقمار الصناعية والسياج الجغرافي
                  </p>
                </div>
                <span className="text-xs text-slate-600 font-bold font-mono">
                  {attendanceHistory.length} سجلات موثقة
                </span>
              </div>

              <div className="space-y-3">
                {attendanceHistory.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{att.eventTitle}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>معتمد بالسياج الجغرافي ({att.distanceToVenueMeters}م)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          المباشر: <strong className="text-slate-800">{att.crewName}</strong> • {att.venueName}
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">{att.bookingNumber}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">تسجيل الحضور (Check-In)</span>
                        <span className="font-bold text-slate-900 font-mono">{att.checkInTime}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {att.checkInCoordinates.lat.toFixed(4)}, {att.checkInCoordinates.lng.toFixed(4)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">تسجيل الانصراف (Check-Out)</span>
                        <span className="font-bold text-slate-900 font-mono">{att.checkOutTime || 'مناوبة جارية'}</span>
                        {att.checkOutCoordinates && (
                          <span className="text-[9px] text-slate-400 block font-mono">
                            {att.checkOutCoordinates.lat.toFixed(4)}, {att.checkOutCoordinates.lng.toFixed(4)}
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">مدة التواجد الميداني</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {att.durationMinutes ? `${att.durationMinutes / 60} ساعات` : 'قيد الاحتساب'}
                        </span>
                        <span className="text-[9px] text-emerald-600 block">
                          {att.autoTriggered ? '⚡ تسجيل تلقائي ذكي' : 'تسجيل يدوي موثق'}
                        </span>
                      </div>
                    </div>

                    {att.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        ملاحظة: {att.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>نظام الحضور الميداني المعتمد بالسياج الجغرافي لمنصة يوصل (Usil)</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            إغلاق البوابة
          </button>
        </div>
      </div>
    </div>
  );
};
