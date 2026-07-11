import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import api from '../../services/api';
import { Eye, EyeOff, Loader2, Hash, User, Mail, BookOpen, Phone, Lock, GraduationCap, MapPin, Calendar, Users, ArrowLeft, CheckCircle, ShieldCheck, Send } from 'lucide-react';
import puplogo from '../../assets/puplogo.png';
import pupbg from '../../assets/pupbg.jpg';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [pupEmail, setPupEmail] = useState('');
  const [pupEmailError, setPupEmailError] = useState('');
  
  const [altEmail, setAltEmail] = useState('');
  const [altEmailError, setAltEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  
  const [form, setForm] = useState({
    student_id: '', first_name: '', middle_name: '', last_name: '',
    birthday: '', gender: '',
    course: '', year: '', section: '', mobile_number: '',
    password: '', password_confirmation: '', agree_terms: false,
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==================== SAVE & RESTORE PROGRESS ====================
  
  // Save progress to localStorage
  useEffect(() => {
    if (step > 1) {
      localStorage.setItem('register_step', step.toString());
      localStorage.setItem('register_pupEmail', pupEmail);
      localStorage.setItem('register_altEmail', altEmail);
      if (verificationToken) {
        localStorage.setItem('register_token', verificationToken);
      }
    }
  }, [step, pupEmail, altEmail, verificationToken]);

  // Restore progress on mount
  useEffect(() => {
    const savedStep = localStorage.getItem('register_step');
    if (savedStep && parseInt(savedStep) > 1) {
      setStep(parseInt(savedStep));
      setPupEmail(localStorage.getItem('register_pupEmail') || '');
      setAltEmail(localStorage.getItem('register_altEmail') || '');
      const savedToken = localStorage.getItem('register_token');
      if (savedToken) {
        setVerificationToken(savedToken);
      }
    }
  }, []);

  // ==================== PASSWORD STRENGTH ====================

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 'Poor', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score <= 3) return { level: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (score <= 4) return { level: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    return { level: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(form.password);
  const passwordsMatch = form.password && form.password_confirmation && form.password === form.password_confirmation;
  const passwordsDontMatch = form.password && form.password_confirmation && form.password !== form.password_confirmation;

  const getSections = (year) => {
    const sectionMap = {
      '1st Year': ['1-1', '1-2', '1-3', '1-4', '1-5'],
      '2nd Year': ['2-1', '2-2', '2-3', '2-4', '2-5'],
      '3rd Year': ['3-1', '3-2', '3-3', '3-4', '3-5'],
      '4th Year': ['4-1', '4-2', '4-3', '4-4', '4-5'],
    };
    return sectionMap[year] || [];
  };

  const courses = [
    { value: 'BSIT', label: 'Bachelor of Science in Information Technology (BSIT)' },
    { value: 'BSCS', label: 'Bachelor of Science in Computer Science (BSCS)' },
    { value: 'BSIS', label: 'Bachelor of Science in Information Systems (BSIS)' },
    { value: 'BSCE', label: 'Bachelor of Science in Civil Engineering (BSCE)' },
    { value: 'BSEE', label: 'Bachelor of Science in Electrical Engineering (BSEE)' },
    { value: 'BSME', label: 'Bachelor of Science in Mechanical Engineering (BSME)' },
    { value: 'BSA', label: 'Bachelor of Science in Accountancy (BSA)' },
    { value: 'BSBA', label: 'Bachelor of Science in Business Administration (BSBA)' },
    { value: 'BSED', label: 'Bachelor of Secondary Education (BSED)' },
    { value: 'BEED', label: 'Bachelor of Elementary Education (BEED)' },
    { value: 'BSN', label: 'Bachelor of Science in Nursing (BSN)' },
    { value: 'BSHM', label: 'Bachelor of Science in Hospitality Management (BSHM)' },
    { value: 'BSTourism', label: 'Bachelor of Science in Tourism Management (BSTourism)' },
    { value: 'BSOA', label: 'Bachelor of Science in Office Administration (BSOA)' },
    { value: 'BPA', label: 'Bachelor of Public Administration (BPA)' },
  ];

  // ==================== STEP 1 ====================
  const handlePupEmailSubmit = (e) => {
    e.preventDefault();
    setPupEmailError('');
    if (!pupEmail.endsWith('@iskolarngbayan.pup.edu.ph')) {
      setPupEmailError('Please use your PUP Webmail (@iskolarngbayan.pup.edu.ph)');
      return;
    }
    setStep(2);
  };

  // ==================== STEP 2 ====================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setAltEmailError('');
    if (!altEmail) {
      setAltEmailError('Please enter your alternate email');
      return;
    }
    setEmailLoading(true);
    try {
      const response = await api.post('/auth/send-otp', { email: pupEmail, alternate_email: altEmail });
      if (response.data.success) setStep(3);
    } catch (err) {
      setAltEmailError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setEmailLoading(false);
    }
  };

  // ==================== STEP 3 ====================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.length !== 6) { setOtpError('Please enter a 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email: pupEmail, otp });
      if (response.data.success) {
        setVerificationToken(response.data.data.verification_token);
        setStep(4);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ==================== STEP 4 ====================
  const validate = () => {
    const newErrors = {};
    const idRegex = /^\d{4}-\d{5}-BN-[01]$/i;
    const nameRegex = /^[A-Za-z\s\-'.]+$/;
    
    if (!form.student_id) newErrors.student_id = 'Student ID is required';
    else if (!idRegex.test(form.student_id)) newErrors.student_id = 'Format: 2023-00000-BN-0';
    if (!form.first_name) newErrors.first_name = 'First name is required';
    else if (!nameRegex.test(form.first_name)) newErrors.first_name = 'Letters only';
    if (form.middle_name && !nameRegex.test(form.middle_name)) newErrors.middle_name = 'Letters only';
    if (!form.last_name) newErrors.last_name = 'Last name is required';
    else if (!nameRegex.test(form.last_name)) newErrors.last_name = 'Letters only';
    if (!form.birthday) newErrors.birthday = 'Birthday is required';
    if (!form.gender) newErrors.gender = 'Gender is required';
    if (!form.course) newErrors.course = 'Course is required';
    if (!form.year) newErrors.year = 'Year is required';
    if (!form.section) newErrors.section = 'Section is required';
    if (!form.mobile_number) newErrors.mobile_number = 'Phone is required';
    else if (!/^(09\d{9}|\+63\d{10})$/.test(form.mobile_number.replace(/\s/g, ''))) 
      newErrors.mobile_number = 'Use 09XXXXXXXXX (11 digits) or +63XXXXXXXXXX (12 digits)';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Min 8 characters';
    if (form.password !== form.password_confirmation) newErrors.password_confirmation = 'Passwords do not match';
    if (!form.agree_terms) newErrors.agree_terms = 'You must agree to continue';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formatted = type === 'checkbox' ? checked : value;
    
    if (name === 'student_id') {
      let raw = value.toUpperCase().replace(/[^0-9BN-]/g, '');
      let clean = raw.replace(/-/g, '');
      if (clean.length <= 4) formatted = clean;
      else if (clean.length <= 9) formatted = clean.slice(0, 4) + '-' + clean.slice(4);
      else if (clean.length <= 11) formatted = clean.slice(0, 4) + '-' + clean.slice(4, 9) + '-' + clean.slice(9);
      else formatted = clean.slice(0, 4) + '-' + clean.slice(4, 9) + '-' + clean.slice(9, 11) + '-' + clean.slice(11);
      if (formatted.length > 17) formatted = formatted.slice(0, 17);
    }
    
    if (['first_name', 'middle_name', 'last_name'].includes(name)) {
      formatted = value.replace(/[^A-Za-z\s\-'.]/g, '');
    }
    
    if (name === 'mobile_number') {
      formatted = value.replace(/[^0-9+]/g, '');
      if (formatted.startsWith('63') && !formatted.startsWith('+')) formatted = '+' + formatted;
      if (formatted.startsWith('+63')) formatted = formatted.slice(0, 13);
      else formatted = formatted.slice(0, 11);
    }
    
    if (name === 'year' && formatted !== form.year) {
      setForm(prev => ({ ...prev, [name]: formatted, section: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: formatted }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setMessage('');
    try {
      let birthday = form.birthday;
      if (birthday && birthday.includes('/')) {
        const parts = birthday.split('/');
        birthday = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      const payload = { ...form, email: pupEmail, birthday, verification_token: verificationToken };
      const res = await authService.register(payload);
      if (res.success) {
        // Clear saved progress
        localStorage.removeItem('register_step');
        localStorage.removeItem('register_pupEmail');
        localStorage.removeItem('register_altEmail');
        localStorage.removeItem('register_token');
        
        setMessage('Account created! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const sections = getSections(form.year);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <img src={pupbg} alt="PUP" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/90 via-maroon-800/85 to-maroon-950/90"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 w-full">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 p-2.5">
            <img src={puplogo} alt="PUP" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <h1 className="text-4xl font-extrabold text-center mb-3">Join <span className="text-yellow-300">CareLink</span></h1>
          <p className="text-yellow-100 text-center">Create your student account</p>
          <div className="flex items-center space-x-3 mt-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-yellow-400 text-maroon-900' : 'bg-white/20 text-white'}`}>{s}</div>
                {s < 4 && <div className={`w-6 h-0.5 ${step > s ? 'bg-yellow-400' : 'bg-white/20'}`}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-gray-50 lg:w-3/5">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl p-6 lg:p-8 border border-gray-100">
            <div className="flex flex-col items-center mb-6 lg:hidden">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-2 p-1.5">
                <img src={puplogo} alt="PUP" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">PUPBC CareLink</h1>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center shadow-lg mb-3"><Mail className="w-9 h-9 text-white" /></div>
                  <h2 className="text-2xl font-bold text-gray-800 text-center">PUP Webmail</h2>
                  <p className="text-sm text-gray-500 mt-2 text-center">Enter your PUP Webmail to verify your student identity</p>
                </div>
                {pupEmailError && <div className="mb-4 p-3 rounded-xl text-sm text-center bg-red-50 text-red-700">{pupEmailError}</div>}
                <form onSubmit={handlePupEmailSubmit} className="space-y-4">
                  <div>
                    <label className="font-semibold text-sm text-gray-700 pb-1 block">PUP Webmail</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                        type="email" value={pupEmail} onChange={(e) => setPupEmail(e.target.value)} placeholder="your.name@iskolarngbayan.pup.edu.ph" required />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-1">Must be your PUP Webmail</p>
                  </div>
                  <button type="submit" className="w-full py-3 bg-gradient-to-r from-maroon-800 to-maroon-900 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 hover:shadow-lg transition">
                    <ShieldCheck className="w-5 h-5" /><span>Continue</span>
                  </button>
                </form>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <div className="mb-4">
                  <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center shadow-lg mb-3"><Send className="w-9 h-9 text-white" /></div>
                  <h2 className="text-2xl font-bold text-gray-800 text-center">Alternate Email</h2>
                  <p className="text-sm text-gray-500 mt-2 text-center">Enter the email where you want to receive the OTP</p>
                </div>
                {altEmailError && <div className="mb-4 p-3 rounded-xl text-sm text-center bg-red-50 text-red-700">{altEmailError}</div>}
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="font-semibold text-sm text-gray-700 pb-1 block">Email Address</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                        type="email" value={altEmail} onChange={(e) => setAltEmail(e.target.value)} placeholder="your.email@gmail.com" required />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-1">OTP will be sent to this email</p>
                  </div>
                  <button type="submit" disabled={emailLoading}
                    className="w-full py-3 bg-gradient-to-r from-maroon-800 to-maroon-900 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 hover:shadow-lg transition">
                    {emailLoading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending...</span></> : <><Send className="w-5 h-5" /><span>Send OTP</span></>}
                  </button>
                </form>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <div className="mb-4">
                  <button onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-2xl flex items-center justify-center shadow-lg mb-3"><CheckCircle className="w-9 h-9 text-white" /></div>
                  <h2 className="text-2xl font-bold text-gray-800 text-center">Enter OTP</h2>
                  <p className="text-sm text-gray-500 mt-2 text-center">A 6-digit code was sent to <strong>{altEmail}</strong></p>
                </div>
                {otpError && <div className="mb-4 p-3 rounded-xl text-sm text-center bg-red-50 text-red-700">{otpError}</div>}
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="font-semibold text-sm text-gray-700 pb-1 block text-center">Verification Code</label>
                    <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] text-xl font-bold focus:ring-2 focus:ring-maroon-500 focus:outline-none"
                      type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} required />
                  </div>
                  <button type="submit" disabled={otpLoading}
                    className="w-full py-3 bg-gradient-to-r from-maroon-800 to-maroon-900 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 hover:shadow-lg transition">
                    {otpLoading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Verifying...</span></> : <><CheckCircle className="w-5 h-5" /><span>Verify & Continue</span></>}
                  </button>
                </form>
              </>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <>
                <div className="mb-4">
                  <button onClick={() => setStep(3)} className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center">Create Account</h2>
                <p className="text-sm text-gray-500 text-center mt-1 mb-4">Complete your registration</p>

                {message && (
                  <div className={`mb-4 p-3 rounded-xl text-sm text-center ${message.includes('created') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Student ID *</label>
                      <div className="relative"><Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.student_id ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          type="text" name="student_id" value={form.student_id} onChange={handleChange} placeholder="2023-00000-BN-0" maxLength={17} required />
                      </div>
                      {errors.student_id && <p className="text-red-500 text-xs mt-0.5">{errors.student_id}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">First Name *</label>
                      <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Juan" required />
                      </div>
                      {errors.first_name && <p className="text-red-500 text-xs mt-0.5">{errors.first_name}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Middle Name</label>
                      <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-maroon-500"
                          type="text" name="middle_name" value={form.middle_name} onChange={handleChange} placeholder="Santos" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Last Name *</label>
                      <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Dela Cruz" required />
                      </div>
                      {errors.last_name && <p className="text-red-500 text-xs mt-0.5">{errors.last_name}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Birthday *</label>
                      <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.birthday ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          type="date" name="birthday" value={form.birthday} onChange={handleChange} required />
                      </div>
                      {errors.birthday && <p className="text-red-500 text-xs mt-0.5">{errors.birthday}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Gender *</label>
                      <div className="relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          name="gender" value={form.gender} onChange={handleChange} required>
                          <option value="">Select Gender</option>
                          <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                        </select>
                      </div>
                      {errors.gender && <p className="text-red-500 text-xs mt-0.5">{errors.gender}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Course *</label>
                      <div className="relative"><BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.course ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          name="course" value={form.course} onChange={handleChange} required>
                          <option value="">Select Course</option>
                          {courses.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      {errors.course && <p className="text-red-500 text-xs mt-0.5">{errors.course}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Year *</label>
                      <div className="relative"><GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.year ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          name="year" value={form.year} onChange={handleChange} required>
                          <option value="">Select Year</option>
                          <option value="1st Year">1st Year</option><option value="2nd Year">2nd Year</option><option value="3rd Year">3rd Year</option><option value="4th Year">4th Year</option>
                        </select>
                      </div>
                      {errors.year && <p className="text-red-500 text-xs mt-0.5">{errors.year}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Section *</label>
                      <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        {sections.length > 0 ? (
                          <select className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.section ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                            name="section" value={form.section} onChange={handleChange} required>
                            <option value="">Select Section</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <input className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.section ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                            type="text" name="section" value={form.section} onChange={handleChange} placeholder="Select year first" disabled />
                        )}
                      </div>
                      {errors.section && <p className="text-red-500 text-xs mt-0.5">{errors.section}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Phone *</label>
                      <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm ${errors.mobile_number ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          type="text" name="mobile_number" value={form.mobile_number} onChange={handleChange} 
                          placeholder="09XXXXXXXXX or +63XXXXXXXXXX" maxLength={13} required />
                      </div>
                      {errors.mobile_number && <p className="text-red-500 text-xs mt-0.5">{errors.mobile_number}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">Format: "09XXXXXXXXX"</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Password *</label>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-sm ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'}`}
                          type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min 8 chars" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 p-1.5 hover:bg-gray-100 rounded-lg">
                          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>}
                      {form.password && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-1">
                            <div className={`h-1.5 flex-1 rounded-full ${passwordStrength.color}`}></div>
                            <div className={`h-1.5 flex-1 rounded-full ${['Poor', 'Weak'].includes(passwordStrength.level) ? 'bg-gray-200' : passwordStrength.color}`}></div>
                            <div className={`h-1.5 flex-1 rounded-full ${passwordStrength.level === 'Poor' ? 'bg-gray-200' : passwordStrength.color}`}></div>
                          </div>
                          <p className={`text-xs font-medium ${passwordStrength.textColor}`}>Strength: {passwordStrength.level}</p>
                          <div className="space-y-1">
                            {[
                              { check: form.password.length >= 8, text: 'At least 8 characters' },
                              { check: /[A-Z]/.test(form.password), text: 'One uppercase letter (A-Z)' },
                              { check: /[a-z]/.test(form.password), text: 'One lowercase letter (a-z)' },
                              { check: /[0-9]/.test(form.password), text: 'One number (0-9)' },
                              { check: /[^A-Za-z0-9]/.test(form.password), text: 'One special character (!@#$%^&*)' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center space-x-1.5">
                                {item.check ? (
                                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />
                                )}
                                <span className={`text-[10px] ${item.check ? 'text-green-600' : 'text-gray-400'}`}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Confirm Password *</label>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-sm ${
                          passwordsMatch ? 'border-green-400 bg-green-50' : passwordsDontMatch ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-maroon-500'
                        }`}
                          type={showConfirmPassword ? 'text' : 'password'} name="password_confirmation" value={form.password_confirmation} onChange={handleChange} placeholder="Re-enter password" required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 p-1.5 hover:bg-gray-100 rounded-lg">
                          {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordsMatch && <p className="text-green-600 text-xs mt-0.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>}
                      {passwordsDontMatch && <p className="text-red-500 text-xs mt-0.5">Passwords do not match</p>}
                      {errors.password_confirmation && <p className="text-red-500 text-xs mt-0.5">{errors.password_confirmation}</p>}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input type="checkbox" name="agree_terms" checked={form.agree_terms} onChange={handleChange}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500" />
                    <label className="text-xs text-gray-500">I agree to the <span className="text-maroon-600 underline">Terms of Service</span> and <span className="text-maroon-600 underline">Privacy Policy</span></label>
                  </div>
                  {errors.agree_terms && <p className="text-red-500 text-xs">{errors.agree_terms}</p>}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-maroon-800 text-white font-semibold rounded-2xl hover:bg-maroon-900 transition flex items-center justify-center space-x-2 disabled:opacity-50">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating...</span></> : 'Create Account'}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account? <Link to="/login" className="text-maroon-600 font-semibold">Login</Link>
            </p>
          </div>
          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-gray-400 hover:underline inline-flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" /><span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;