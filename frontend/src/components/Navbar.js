import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          StoryLift
        </Link>

        <div className="nav-content">
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            {isAuthenticated && (
              <>
                <Link to="/upload" className="nav-link">Upload</Link>
                <Link to="/jobs" className="nav-link">Jobs</Link>
              </>
            )}
          </div>

          <div className="nav-auth">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-greeting">
                  Hi, {user.first_name}
                </span>
                <button className="nav-button logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="nav-button login-btn">
                  Login
                </Link>
                <Link to="/register" className="nav-button register-btn">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;