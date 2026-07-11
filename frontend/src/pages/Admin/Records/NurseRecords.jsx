import { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, Loader2, Stethoscope, Pill, ClipboardList } from 'lucide-react';
import api from '../../../services/api';

const NurseRecords = () => {
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await api.get('/nurse/consultations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const data = response.data.data;
        const consultations = Array.isArray(data) ? data : (data?.data || []);
        const formatted = consultations.map(c => ({
          id: c.id,
          student: (c.user?.first_name || '') + ' ' + (c.user?.last_name || 'Unknown'),
          student_id: c.user?.student_id || 'N/A',
          date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
          diagnosis: c.diagnosis || c.chief_complaint || 'N/A',
          treatment: c.treatment || c.general_remarks || 'N/A',
          medicine: c.medicine || c.prescription || 'None',
          nurse: (c.nurse?.first_name || '') + ' ' + (c.nurse?.last_name || 'N/A'),
          bp: c.bp,
          hr: c.hr,
          temp: c.temp,
        }));
        setRecords(formatted);
      }
    } catch (err) {
      console.log('Records error:', err);
      setError('Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r => 
    r.student.toLowerCase().includes(search.toLowerCase()) ||
    r.student_id.toLowerCase().includes(search.toLowerCase()) ||
    r.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-maroon-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Records</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">View consultation history</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm text-center">{error}</div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          className="w-full border border-gray-200 dark:border-gray-600 rounded-2xl pl-10 pr-4 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-maroon-500"
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search student name, ID, or diagnosis..." 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No Medical Records Found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'No records match your search.' : 'Consultation records will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-maroon-50 dark:bg-maroon-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{r.student}</h3>
                      <p className="text-xs text-gray-400">{r.student_id}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 inline mr-1" />{r.date}
                    </span>
                  </div>
                  
                  {/* Vital Signs (if available) */}
                  {(r.bp || r.hr || r.temp) && (
                    <div className="flex gap-2 mt-3 mb-2">
                      {r.bp && <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg">BP: {r.bp}</span>}
                      {r.hr && <span className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg">HR: {r.hr}</span>}
                      {r.temp && <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-lg">Temp: {r.temp}</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> Diagnosis</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{r.diagnosis}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Treatment</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{r.treatment}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Pill className="w-3 h-3" /> Medicine</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{r.medicine}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Nurse</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0.5">{r.nurse}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseRecords;