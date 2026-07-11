import { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, GraduationCap, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const NurseStudents = () => {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await api.get('/nurse/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
    // Handle paginated response
    const data = response.data.data;
    if (data && Array.isArray(data)) {
        setStudents(data);
    } else if (data && data.data && Array.isArray(data.data)) {
        setStudents(data.data);
    } else {
        setStudents([]);
    }
}
    } catch (err) {
      console.log('Fetch students error:', err);
      setError('Unable to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = Array.isArray(students) ? students.filter(s => {
    const name = (s.first_name + ' ' + s.last_name).toLowerCase();
    const id = (s.student_id || '').toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || id.includes(query);
  }) : [];

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">View student records</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm text-center">{error}</div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          className="w-full border border-gray-200 dark:border-gray-600 rounded-2xl pl-10 pr-4 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-maroon-500"
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search student name or ID..." 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No Students Found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'No students match your search.' : 'Registered students will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id || Math.random()} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-maroon-50 dark:bg-maroon-900/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-maroon-800 dark:text-maroon-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{s.first_name} {s.last_name}</h3>
                  <p className="text-xs text-gray-400">{s.student_id}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>{s.course} {s.year ? '- ' + s.year : ''} {s.section || ''}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{s.mobile_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseStudents;