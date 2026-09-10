import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, User, Mail, Lock, Phone, MapPin, Calendar, Hash, Users, GraduationCap, UserCircle } from 'lucide-react';
import puplogo from '../../assets/puplogo.png';
import pupbg from '../../assets/pupbg.jpg';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    birthday: '',
    gender: '',
    course: '',
    year: '',
    section: '',
    mobile_number: '',
    address: '',
    guardian_name: '',
    guardian_contact: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const validateStep1 = () => {
    const newErrors = {};
    const idRegex = /^\d{4}-\d{5}-BN-[01]$/;
    if (!form.student_id) newErrors.student_id = 'Student ID is required';
    else if (!idRegex.test(form.student_id)) newErrors.student_id = 'Format: 2016-00000-BN-0 or BN-1';
    if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (form.password !== form.password_confirmation) newErrors.password_confirmation = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!form.birthday) newErrors.birthday = 'Birthday is required';
    if (!form.gender) newErrors.gender = 'Gender is required';
    if (!form.course.trim()) newErrors.course = 'Course is required';
    if (!form.year) newErrors.year = 'Year is required';
    if (!form.section.trim()) newErrors.section = 'Section is required';
    if (!form.mobile_number.trim()) newErrors.mobile_number = 'Mobile number is required';
    else if (!/^09\d{9}$/.test(form.mobile_number)) newErrors.mobile_number = 'Format: 09XXXXXXXXX';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!form.guardian_name.trim()) newErrors.guardian_name = 'Contact name is required';
    if (!form.guardian_contact.trim()) newErrors.guardian_contact = 'Contact number is required';
    else if (!/^09\d{9}$/.test(form.guardian_contact)) newErrors.guardian_contact = 'Format: 09XXXXXXXXX';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) { setCurrentStep(2); setErrors({}); }
    else if (currentStep === 2 && validateStep2()) { setCurrentStep(3); setErrors({}); }
  };

  const handleBack = () => {
    if (currentStep > 1) { setCurrentStep(currentStep - 1); setErrors({}); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'student_id') { formatted = value.toUpperCase().replace(/\s/g, ''); }
    setForm({ ...form, [name]: formatted });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    setError('');
    try {
      await authService.register(form);
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${errors[field] ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:focus:ring-maroon-400 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={pupbg} alt="PUP Background" className="w-full h-full object-cover opacity-10 dark:opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-800/20 via-transparent to-maroon-900/20 dark:from-maroon-900/30 dark:via-transparent dark:to-maroon-950/30"></div>
      </div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-maroon-200/30 dark:bg-maroon-800/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-200/30 dark:bg-red-800/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-rose-200/30 dark:bg-rose-800/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      <div className="relative z-10 w-full max-w-lg animate-fadeInUp">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4 p-2">
            <img src={puplogo} alt="PUP Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Create Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join PUP CareLink today</p>
        </div>
        <div className="flex items-center justify-center mb-6 space-x-2">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${currentStep >= step ? 'bg-gradient-to-r from-maroon-700 to-maroon-800 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 rounded-full transition-all duration-300 ${currentStep > step ? 'bg-gradient-to-r from-maroon-600 to-maroon-700' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl mb-4 text-sm animate-shake">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Account Information</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Step 1 of 3</p>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="text" name="student_id" placeholder="Student ID (e.g., 2021-00000-BN-0)" value={form.student_id} onChange={handleChange} className={inputClass('student_id')} required />
                  {errors.student_id && <p className="text-red-500 text-xs mt-1 ml-1">{errors.student_id}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="text" name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} className={inputClass('first_name')} required />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.first_name}</p>}
                  </div>
                  <div className="relative">
                    <input type="text" name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border ${errors.last_name ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:focus:ring-maroon-400 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`} required />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.last_name}</p>}
                  </div>
                </div>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="text" name="middle_name" placeholder="Middle Initial (e.g., D.)" value={form.middle_name} onChange={handleChange} maxLength={10} className={inputClass('middle_name')} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} className={inputClass('email')} required />
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password (min. 8 characters)" value={form.password} onChange={handleChange} className={inputClass('password')} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600" tabIndex={-1}>
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type={showConfirmPassword ? 'text' : 'password'} name="password_confirmation" placeholder="Confirm Password" value={form.password_confirmation} onChange={handleChange} className={inputClass('password_confirmation')} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600" tabIndex={-1}>
                    {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password_confirmation}</p>}
                </div>
                <button type="button" onClick={handleNext} className="w-full py-3 px-4 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-maroon-950 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Personal Information</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Step 2 of 3</p>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="date" name="birthday" value={form.birthday} onChange={handleChange} className={`${inputClass('birthday')} [color-scheme:light] dark:[color-scheme:dark]`} required />
                  {errors.birthday && <p className="text-red-500 text-xs mt-1 ml-1">{errors.birthday}</p>}
                </div>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <select name="gender" value={form.gender} onChange={handleChange} className={`${inputClass('gender')} appearance-none cursor-pointer`} required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1 ml-1">{errors.gender}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input type="text" name="course" placeholder="Course (e.g., BSIT)" value={form.course} onChange={handleChange} className={`w-full pl-10 pr-2 py-3 bg-gray-50 dark:bg-gray-700 border ${errors.course ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:focus:ring-maroon-400 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`} required />
                    {errors.course && <p className="text-red-500 text-xs mt-1 ml-1">{errors.course}</p>}
                  </div>
                  <div>
                    <select name="year" value={form.year} onChange={handleChange} className={`w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 border ${errors.year ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:focus:ring-maroon-400 text-gray-800 dark:text-gray-100 transition-all duration-200 appearance-none cursor-pointer`} required>
                      <option value="">Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    {errors.year && <p className="text-red-500 text-xs mt-1 ml-1">{errors.year}</p>}
                  </div>
                  <div>
                    <input type="text" name="section" placeholder="Section" value={form.section} onChange={handleChange} className={`w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 border ${errors.section ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:focus:ring-maroon-400 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`} required />
                    {errors.section && <p className="text-red-500 text-xs mt-1 ml-1">{errors.section}</p>}
                  </div>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="tel" name="mobile_number" placeholder="Mobile Number (09171234567)" value={form.mobile_number} onChange={handleChange} maxLength={11} className={inputClass('mobile_number')} required />
                  {errors.mobile_number && <p className="text-red-500 text-xs mt-1 ml-1">{errors.mobile_number}</p>}
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <textarea name="address" placeholder="Complete Address" value={form.address} onChange={handleChange} rows={2} className={`${inputClass('address')} resize-none`} required />
                  {errors.address && <p className="text-red-500 text-xs mt-1 ml-1">{errors.address}</p>}
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2">
                    <ArrowLeft className="w-5 h-5" /><span>Back</span>
                  </button>
                  <button type="button" onClick={handleNext} className="flex-1 py-3 px-4 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-maroon-950 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2">
                    <span>Next</span><ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Emergency Contact</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Step 3 of 3</p>
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="text" name="guardian_name" placeholder="Contact Person Name (Parent/Guardian)" value={form.guardian_name} onChange={handleChange} className={inputClass('guardian_name')} required />
                  {errors.guardian_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.guardian_name}</p>}
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input type="tel" name="guardian_contact" placeholder="Contact Person Mobile (09171234567)" value={form.guardian_contact} onChange={handleChange} maxLength={11} className={inputClass('guardian_contact')} required />
                  {errors.guardian_contact && <p className="text-red-500 text-xs mt-1 ml-1">{errors.guardian_contact}</p>}
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Note:</strong> Your emergency contact will be notified in case of medical emergencies during clinic visits.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={handleBack} className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2">
                    <ArrowLeft className="w-5 h-5" /><span>Back</span>
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 px-4 bg-gradient-to-r from-maroon-800 to-maroon-900 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Creating...</span></>) : (<><span>Create Account</span><ArrowRight className="w-5 h-5" /></>)}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            <span className="px-4 text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 transition-colors inline-flex items-center space-x-1">
                <span>Sign In</span><ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-gray-400 dark:text-gray-500 hover:underline inline-flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3" /><span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
