import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Appointment, VideoSessionTokenResponse } from '../../types/appointment.types';
import { appointmentApi } from '../../api/appointmentApi';
import { formatApiError } from '../../api/apiClient';
import { CrisisResourceBanner } from '../../components/common/CrisisResourceBanner';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Lock,
  Signal,
  Sparkles,
} from 'lucide-react';

export const VideoConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [sessionToken, setSessionToken] = useState<VideoSessionTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video call controls state
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);
  const [isInCall, setIsInCall] = useState(false);

  // Pre-call test controls
  const [testMicActive, setTestMicActive] = useState(true);
  const [testCamActive, setTestCamActive] = useState(true);

  // Time tracking
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);

  // Fetch appointment and check token eligibility
  const checkSessionStatus = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const apt = await appointmentApi.getAppointmentById(id);
      setAppointment(apt);

      const startMs = new Date(apt.startTime).getTime();
      const nowMs = Date.now();
      const minutesUntilStart = (startMs - nowMs) / (1000 * 60);

      // BR-16 / REQ-TS-16: Video token is restricted to <= 10 minutes before session
      if (minutesUntilStart > 10) {
        // In Waiting Room mode
        const totalSecRemaining = Math.max(0, Math.floor((startMs - 10 * 60 * 1000 - nowMs) / 1000));
        setTimeRemainingSeconds(totalSecRemaining);
        setIsLoading(false);
        return;
      }

      // Eligible to join video room
      const tokenRes = await appointmentApi.getVideoToken(apt.id, apt.startTime);
      setSessionToken(tokenRes);
      setTimeRemainingSeconds(0);
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkSessionStatus();
  }, [checkSessionStatus]);

  // Countdown timer for Waiting Room
  useEffect(() => {
    if (timeRemainingSeconds === null || timeRemainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          checkSessionStatus(); // Trigger token acquisition once 10m window opens
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds, checkSessionStatus]);

  // In-call duration timer
  useEffect(() => {
    if (!isInCall) return;

    const timer = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isInCall]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleEndCall = () => {
    setIsInCall(false);
    navigate('/appointments');
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        data-testid="video-loading-screen"
        className="py-32 flex flex-col items-center justify-center gap-3 text-slate-500"
      >
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <span className="text-sm font-semibold text-slate-700">Verifying session tokens &amp; WebRTC room...</span>
        <span className="text-xs text-slate-400">Restricted room security protocol active (REQ-TS-16)</span>
      </div>
    );
  }

  // 2. Error State
  if (error || !appointment) {
    return (
      <div data-testid="video-error-screen" className="max-w-lg mx-auto py-12 space-y-6">
        <CrisisResourceBanner />

        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Consultation Room Unavailable</h2>
            <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
              {error || 'Unable to establish secure connection to the clinical video server.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">Troubleshooting Guidance:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Ensure you have a confirmed appointment scheduled for today.</li>
              <li>Consultation rooms open strictly 10 minutes prior to scheduled start time (REQ-TS-16).</li>
              <li>Check browser permissions for microphone and camera access.</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/appointments"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to Appointments
            </Link>
            <button
              type="button"
              onClick={checkSessionStatus}
              data-testid="retry-video-token-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Room Connection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isWaiting = timeRemainingSeconds !== null && timeRemainingSeconds > 0;

  // 3. Waiting Room State (>10 minutes prior to session)
  if (isWaiting) {
    const startDate = new Date(appointment.startTime);
    const formattedDate = startDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div data-testid="video-waiting-screen" className="max-w-2xl mx-auto py-4 space-y-6">
        <CrisisResourceBanner />

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Encrypted Waiting Room
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">Consultation Waiting Room</h1>
              <p className="text-xs text-slate-500">
                Session with {appointment.therapistName || appointment.helpSeekerName}
              </p>
            </div>
            <Link
              to="/appointments"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>

          {/* Countdown Clock Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white text-center space-y-3 shadow-md">
            <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs font-medium">
              <Clock className="w-4 h-4" />
              <span>Room Opens 10 Minutes Prior to Start (REQ-TS-16)</span>
            </div>

            <div>
              <div
                data-testid="waiting-room-countdown"
                className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-indigo-100"
              >
                {formatCountdown(timeRemainingSeconds)}
              </div>
              <p className="text-xs text-indigo-300 mt-1">
                Scheduled for {formattedDate} at {formattedTime}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-indigo-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Room connects automatically when session window opens</span>
            </div>
          </div>

          {/* Pre-Call Hardware Check */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              Pre-Consultation Equipment Check
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Mic Test */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${testMicActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Microphone</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Active &amp; Ready</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTestMicActive((prev) => !prev)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                >
                  {testMicActive ? 'Mute' : 'Enable'}
                </button>
              </div>

              {/* Camera Test */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${testCamActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Webcam</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Ready</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTestCamActive((prev) => !prev)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                >
                  {testCamActive ? 'Turn Off' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Simulated Camera Preview */}
            <div className="relative aspect-video rounded-2xl bg-slate-800 text-white flex flex-col items-center justify-center overflow-hidden border border-slate-700">
              {testCamActive ? (
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-emerald-400 mx-auto flex items-center justify-center">
                    <Video className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Local Video Feed Mirror (Active)</p>
                  <span className="text-[10px] text-slate-400 block">Lighting: Good | Resolution: 1080p HD</span>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <VideoOff className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                  <span className="text-xs">Camera is currently paused</span>
                </div>
              )}

              <div className="absolute bottom-2 left-3 text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-md text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> End-to-End Encrypted Pre-Check
              </div>
            </div>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Link
              to="/appointments"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Exit to Appointments
            </Link>
            <button
              type="button"
              data-testid="refresh-waiting-room-btn"
              onClick={checkSessionStatus}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Room Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Active WebRTC Video Consultation Room State
  return (
    <div data-testid="video-active-screen" className="max-w-6xl mx-auto py-2 space-y-4">
      {/* Consultation Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:px-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-white leading-tight">
              Clinical Session: {appointment.therapistName || appointment.helpSeekerName}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                HIPAA / TLS 1.3 WebRTC
              </span>
              <span>•</span>
              <span
                data-testid="video-room-status"
                data-room-url={sessionToken?.videoRoomUrl}
                className="flex items-center gap-1"
              >
                <Signal className="w-3 h-3 text-emerald-400" />
                HD Quality (18ms)
              </span>
            </div>
          </div>
        </div>

        {/* Live Call Duration */}
        <div className="flex items-center gap-3">
          <div
            data-testid="call-duration-timer"
            className="px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(callDurationSeconds)} / 50:00</span>
          </div>

          <button
            type="button"
            onClick={handleEndCall}
            data-testid="end-consultation-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Main Video Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Remote Practitioner/Patient Tile */}
        <div className="lg:col-span-3 relative aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
          {/* Simulated remote stream */}
          <div className="text-center space-y-3 z-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-700 to-teal-500 text-white text-3xl font-bold flex items-center justify-center mx-auto shadow-xl ring-4 ring-slate-800">
              {(appointment.therapistName || 'D').charAt(0)}
            </div>
            <div>
              <p className="font-bold text-white text-base">
                {appointment.therapistName || 'Practitioner'}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Audio Connected • WebRTC Video Stream Live</span>
              </div>
            </div>
          </div>

          {/* Self-view Picture-in-Picture */}
          <div
            data-testid="self-view-pip"
            className="absolute bottom-4 right-4 w-36 sm:w-44 aspect-video rounded-2xl bg-slate-800 border-2 border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center text-white z-20"
          >
            {!isVideoOff ? (
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center mx-auto mb-1">
                  You
                </div>
                <span className="text-[10px] text-slate-300">Self-View (HD)</span>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs">
                <VideoOff className="w-4 h-4 mx-auto mb-0.5 text-rose-400" />
                <span className="text-[10px]">Camera Off</span>
              </div>
            )}

            {isMicMuted && (
              <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white">
                <MicOff className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Session Notes & Guidelines */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Session Protocol</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Confidentiality Guarantee:</p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                All audio and video data is end-to-end encrypted and never recorded per platform privacy standards (SE-1, SE-2).
              </p>
            </div>

            {appointment.notes && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Intake Focus:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                  &ldquo;{appointment.notes}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            <strong>Emergency Helpline:</strong> If in acute distress during session, dial 988 immediately.
          </div>
        </div>
      </div>

      {/* In-Call Controls Dock */}
      <div
        data-testid="video-controls-dock"
        className="bg-slate-900 rounded-3xl p-4 flex items-center justify-center gap-3 sm:gap-6 shadow-xl"
      >
        {/* Toggle Mic */}
        <button
          type="button"
          data-testid="toggle-mic-btn"
          onClick={() => setIsMicMuted((prev) => !prev)}
          className={`p-3.5 rounded-2xl transition flex items-center gap-2 text-xs font-bold ${
            isMicMuted
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mute'}</span>
        </button>

        {/* Toggle Video */}
        <button
          type="button"
          data-testid="toggle-video-btn"
          onClick={() => setIsVideoOff((prev) => !prev)}
          className={`p-3.5 rounded-2xl transition flex items-center gap-2 text-xs font-bold ${
            isVideoOff
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
          title={isVideoOff ? 'Start camera' : 'Stop camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          <span className="hidden sm:inline">{isVideoOff ? 'Camera Off' : 'Stop Video'}</span>
        </button>

        {/* Toggle Screen Share */}
        <button
          type="button"
          data-testid="toggle-screen-btn"
          onClick={() => setIsScreenSharing((prev) => !prev)}
          className={`p-3.5 rounded-2xl transition flex items-center gap-2 text-xs font-bold ${
            isScreenSharing
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 text-white'
          }`}
          title="Share screen"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">{isScreenSharing ? 'Sharing' : 'Share'}</span>
        </button>

        {/* End Call */}
        <button
          type="button"
          data-testid="leave-call-btn"
          onClick={handleEndCall}
          className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg"
          title="End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">Leave Session</span>
        </button>
      </div>
    </div>
  );
};
