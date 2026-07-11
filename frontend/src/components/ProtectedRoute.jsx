import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    // Redirect nurses to nurse login, students to student login
    if (user?.role === 'nurse' || user?.role === 'admin') {
      return <Navigate to="/carelink-portal" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;