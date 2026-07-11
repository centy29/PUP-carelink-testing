import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, CheckCircle, Loader2, AlertCircle, ArrowLeft, Shield, QrCode, GraduationCap, Phone, Heart, Users } from 'lucide-react';
import api from '../../services/api';
import KioskLayout from '../../layouts/KioskLayout';

const KioskConfirm = ({ data, onCheckedIn, onBack }) => {
  const { user, appointment, has_active_checkin, active_checkin } = data;
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  ];

  // Fetch available slots for today
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get(`/kiosk/available-slots?date=${today}`);
        if (res.data.success) {
          setAvailableSlots(res.data.data.slots || []);
        }
      } catch (err) {
        console.log('Fetch slots error:', err);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();

    // Poll every 15 seconds
    const interval = setInterval(fetchSlots, 15000);
    return () => clearInterval(interval);
  }, []);

  const getSlotInfo = (time) => {
    const slot = availableSlots.find(s => s.time === time);
    if (!slot) return { available: 10, booked: 0, isFull: false };
    return slot;
  };

  const handleCheckin = async () => {
    if (!appointment && !reason.trim()) {
      setError('Please enter your reason for visit.');
      return;
    }
    if (!appointment && !selectedSlot) {
      setError('Please select a time slot for your walk-in visit.');
      return;
    }
    if (submitted) return;
    
    setSubmitted(true);
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/kiosk/checkin', {
        student_id: user.student_id,
        reason: reason || appointment?.concern || 'Consultation',
        is_walk_in: !appointment,
        time_slot: !appointment ? selectedSlot : undefined,
      });
      if (response.data.success) {
        onCheckedIn(response.data.data);
      }
    } catch (err) {
      setSubmitted(false);
      if (err.response?.status === 409) {
        setError('You are already checked in for today.');
      } else {
        setError(err.response?.data?.message || 'Check-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Already checked in
  if (has_active_checkin && active_checkin) {
    return (
      <KioskLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500/30">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Already Checked In</h1>
          <div className={`rounded-3xl p-8 my-6 ${active_checkin.queue_type === 'priority' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-400/5 border-yellow-400/20'} border-2`}>
            <p className="text-6xl md:text-7xl font-black text-yellow-300">{active_checkin.queue_number}</p>
            <p className="text-white/40 text-sm mt-2 capitalize">{active_checkin.queue_type} Queue</p>
          </div>
          <p className="text-white/30 text-sm">Please wait for your number to be called.</p>
        </motion.div>
      </KioskLayout>
    );
  }

  return (
    <KioskLayout>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto">
        
        <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 mb-6 transition">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Confirm Check-in</h1>

        {/* Student Profile Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 rounded-2xl flex items-center justify-center border border-yellow-400/20 text-2xl font-bold text-yellow-300">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.first_name} {user.last_name}</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs bg-white/10 px-2 py-1 rounded-lg text-white/50">{user.student_id}</span>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-lg text-white/50">{user.course}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/40">
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {user.year} Year</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.mobile_number || 'N/A'}</span>
          </div>
        </div>

        {/* Appointment or Walk-in */}
        <AnimatePresence mode="wait">
          {appointment ? (
            <motion.div key="appointment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-green-500/5 backdrop-blur-xl rounded-3xl p-5 border border-green-500/20 mb-4">
              <div className="flex items-center gap-2 text-green-400 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Scheduled Today</span>
              </div>
              <div className="flex gap-4 text-green-300/70 text-sm">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {appointment.appointment_date}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {appointment.time_slot || 'N/A'}</span>
              </div>
              <p className="text-green-400/40 text-xs mt-2">{appointment.service}</p>
            </motion.div>
          ) : (
            <motion.div key="walkin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-yellow-500/5 backdrop-blur-xl rounded-3xl p-5 border border-yellow-500/20 mb-4 space-y-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Walk-in Visit</span>
              </div>
              
              {/* Reason */}
              <div>
                <label className="text-white/40 text-sm block mb-2">Reason for Visit *</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder-white/15 focus:border-yellow-400/50 focus:outline-none resize-none"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or concern..."
                />
              </div>

              {/* Slot Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/40 text-sm">Select Time Slot *</label>
                  {slotsLoading && <Loader2 className="w-3 h-3 animate-spin text-white/20" />}
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {timeSlots.map(time => {
                    const slot = getSlotInfo(time);
                    const isFull = slot.isFull;
                    const isSelected = selectedSlot === time;
                    
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlot(time)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-all text-center ${
                          isFull 
                            ? 'bg-red-500/5 text-red-400/30 border border-red-500/10 cursor-not-allowed'
                            : isSelected
                              ? 'bg-yellow-400 text-maroon-900 border border-yellow-400'
                              : slot.available <= 3
                                ? 'bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/20 hover:border-yellow-400/40'
                                : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
                        }`}>
                        <div>{time}</div>
                        {!isFull && (
                          <div className="text-[9px] mt-0.5 opacity-60">
                            {slot.available}/10
                          </div>
                        )}
                        {isFull && (
                          <div className="text-[9px] mt-0.5">Full</div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] text-white/20 mt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400/50" /> Available</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400/50" /> Filling up</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400/50" /> Full</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleCheckin}
          disabled={loading || submitted}
          className="w-full py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-maroon-900 font-bold rounded-2xl text-lg transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-yellow-400/10">
          {loading ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> Checking in...</>
          ) : (
            <><CheckCircle className="w-6 h-6" /> Check In Now</>
          )}
        </motion.button>
      </motion.div>
    </KioskLayout>
  );
};

export default KioskConfirm;