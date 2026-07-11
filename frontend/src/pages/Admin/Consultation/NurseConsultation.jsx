import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Stethoscope, Heart, Save, Loader2, Users, ClipboardList } from 'lucide-react';
import api from '../../../services/api';

const NurseConsultation = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [checkedInStudents, setCheckedInStudents] = useState([]);

  const [form, setForm] = useState({
    chief_complaint: '', bp: '', hr: '', rr: '', temp: '', o2_sat: '',
    general_remarks: '', medical_certificate: false, medical_certificate_ref: '',
    follow_up: false, follow_up_date: '',
  });

  useEffect(() => {
    fetchCheckedInStudents();
  }, []);

  const fetchCheckedInStudents = async () => {
    try {
      setPageLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/kiosk/today-checkins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const data = response.data.data;
        const checkins = Array.isArray(data) ? data : (data?.data || []);
        const formatted = checkins.map(c => ({
          id: c.user?.student_id || c.student_id || 'N/A',
          user_id: c.user_id,
          name: (c.user?.first_name || '') + ' ' + (c.user?.last_name || ''),
          appointment: c.appointment?.reason || 'Walk-in',
          complaint: c.appointment?.concern || c.appointment?.reason || 'N/A',
        }));
        setCheckedInStudents(formatted);
      }
    } catch (err) {
      console.log('Checkins error:', err);
      // If endpoint fails, show empty with message
      setCheckedInStudents([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        user_id: selectedStudent.user_id || selectedStudent.id,
        chief_complaint: form.chief_complaint,
        bp: form.bp || null,
        hr: form.hr || null,
        rr: form.rr || null,
        temp: form.temp || null,
        o2_sat: form.o2_sat || null,
        general_remarks: form.general_remarks || null,
        medical_certificate: form.medical_certificate,
        medical_certificate_ref: form.medical_certificate_ref || null,
        follow_up: form.follow_up,
        follow_up_date: form.follow_up_date || null,
      };

      const response = await api.post('/nurse/consultations', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessageType('success');
        setMessage('Consultation recorded successfully!');
        setStep(1);
        setSelectedStudent(null);
        setForm({
          chief_complaint: '', bp: '', hr: '', rr: '', temp: '', o2_sat: '',
          general_remarks: '', medical_certificate: false, medical_certificate_ref: '',
          follow_up: false, follow_up_date: '',
        });
        // Refresh checkins
        fetchCheckedInStudents();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to save consultation.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-maroon-500 focus:outline-none";
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5";

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-maroon-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consultation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Record student consultation</p>
      </div>

      {message && (
        <div className={`p-3 rounded-2xl text-sm text-center ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>{message}</div>
      )}

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
            <span>Select Checked-in Student</span>
          </h3>
          
          {checkedInStudents.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500">No Checked-in Students</h3>
              <p className="text-sm text-gray-400 mt-1">Students who check in via QR will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkedInStudents.map((s, i) => (
                <button key={i} onClick={() => { setSelectedStudent(s); setStep(2); }}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border border-gray-100 dark:border-gray-700 text-left">
                  <div className="w-10 h-10 bg-maroon-50 dark:bg-maroon-900/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.appointment}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.complaint}</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full font-semibold">Checked In</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {step === 2 && selectedStudent && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-6 pb-4 border-b">
            <div className="w-12 h-12 bg-maroon-50 dark:bg-maroon-900/20 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-maroon-800 dark:text-maroon-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{selectedStudent.name}</h3>
              <p className="text-sm text-gray-400">{selectedStudent.id} — {selectedStudent.appointment}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Chief Complaint *</label>
              <textarea name="chief_complaint" value={form.chief_complaint} onChange={handleChange} rows={3} 
                className={inputClass} placeholder="Describe the student's main concern..." required />
            </div>
            
            <div>
              <label className={`${labelClass} flex items-center space-x-2`}>
                <Heart className="w-4 h-4 text-red-500" /><span>Vital Signs (Optional)</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { name: 'bp', label: 'BP', placeholder: '120/80' },
                  { name: 'hr', label: 'HR', placeholder: '72 bpm' },
                  { name: 'rr', label: 'RR', placeholder: '16' },
                  { name: 'temp', label: 'Temp', placeholder: '36.5°C' },
                  { name: 'o2_sat', label: 'O2 Sat', placeholder: '98%' }
                ].map(v => (
                  <div key={v.name}>
                    <label className="text-[10px] text-gray-400 block mb-1">{v.label}</label>
                    <input name={v.name} value={form[v.name]} onChange={handleChange} 
                      className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                      placeholder={v.placeholder} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>General Remarks</label>
              <textarea name="general_remarks" value={form.general_remarks} onChange={handleChange} rows={3} 
                className={inputClass} placeholder="Additional notes..." />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              <span className="text-sm">Issue Medical Certificate?</span>
              <input type="checkbox" name="medical_certificate" checked={form.medical_certificate} onChange={handleChange} 
                className="w-5 h-5 accent-maroon-800" />
            </div>
            {form.medical_certificate && (
              <div>
                <label className={labelClass}>Certificate Reference</label>
                <input name="medical_certificate_ref" value={form.medical_certificate_ref} onChange={handleChange} 
                  className={inputClass} placeholder="MED-2024-001" />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              <span className="text-sm">Follow-up Required?</span>
              <input type="checkbox" name="follow_up" checked={form.follow_up} onChange={handleChange} 
                className="w-5 h-5 accent-maroon-800" />
            </div>
            {form.follow_up && (
              <div>
                <label className={labelClass}>Follow-up Date</label>
                <input type="date" name="follow_up_date" value={form.follow_up_date} onChange={handleChange} className={inputClass} />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={() => setStep(1)} 
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 rounded-2xl font-semibold">Back</button>
              <button type="submit" disabled={loading} 
                className="flex-1 py-3 bg-maroon-800 text-white rounded-2xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{loading ? 'Saving...' : 'Save Consultation'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default NurseConsultation;