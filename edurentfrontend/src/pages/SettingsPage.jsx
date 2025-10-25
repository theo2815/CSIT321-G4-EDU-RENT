import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header'; // Assuming Header component is used
import { getCurrentUser } from '../services/apiService'; // To fetch user data

// Import CSS
import '../static/SettingsPage.css'; // Main settings styles

// --- NEW Settings Skeleton Component ---
function SettingsSkeleton() {
  return (
    <div className="settings-skeleton-container">
      {/* Skeleton Sidebar */}
      <aside className="settings-sidebar" style={{ borderRight: '1px solid #eee' }}> {/* Added border for visual separation */}
        <div className="skeleton skeleton-sidebar-item" style={{ width: '70%' }}></div>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '80%' }}></div>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '75%' }}></div>
      </aside>

      {/* Skeleton Content Area */}
      <main className="settings-content">
        <div className="skeleton skeleton-settings-card"></div>
      </main>
    </div>
  );
}


// --- Edit Profile Form Component ---
function EditProfileForm({ userData, profileData, onChange, onSave }) {
    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Edit Profile</h2>
            <div className="profile-photo-section">
                <div className="profile-photo-container">
                  <img
                    src={userData?.profilePictureUrl || 'https://via.placeholder.com/80'}
                    alt="Profile"
                    className="profile-photo-placeholder"
                  />
                  <div className="edit-icon-overlay" title="Change photo">
                    ✏️
                  </div>
                </div>
                {/* Optional: Add text/button for uploading */}
                {/* <button className='btn btn-small btn-outline'>Upload Photo</button> */}
            </div>
            <form onSubmit={onSave}>
                {/* Account Details */}
                <div className="form-section">
                    <span className="form-section-label">Account details (Public)</span>
                    <div className="form-grid">
                        <div>
                          <label htmlFor="fullName" className="form-label">Full Name</label>
                          <input type="text" id="fullName" name="fullName" value={profileData.fullName} onChange={onChange} className="form-input"/>
                        </div>
                        <div>
                          <label htmlFor="address" className="form-label">Address</label>
                          <input type="text" id="address" name="address" value={profileData.address} onChange={onChange} className="form-input"/>
                        </div>
                        <div>
                          <label htmlFor="schoolName" className="form-label">School</label>
                          <input type="text" id="schoolName" name="schoolName" value={profileData.schoolName} readOnly className="form-input readonly"/>
                        </div>
                        <div style={{ gridColumn: 'span 1 / span 2' }}>
                          <label htmlFor="bio" className="form-label">Bio</label>
                          <textarea id="bio" name="bio" value={profileData.bio} onChange={onChange} className="form-input form-textarea" placeholder="Tell us a little about yourself..."/>
                        </div>
                    </div>
                </div>
                {/* Private Details */}
                <div className="form-section">
                    <span className="form-section-label">Private details</span>
                    <div className="form-grid form-grid-cols-2">
                        <div>
                          <label htmlFor="email" className="form-label">Email</label>
                          <input type="email" id="email" name="email" value={profileData.email} readOnly className="form-input readonly"/>
                        </div>
                        <div>
                          <label htmlFor="phoneNumber" className="form-label">Phone number</label>
                          <input type="tel" id="phoneNumber" name="phoneNumber" value={profileData.phoneNumber} onChange={onChange} className="form-input"/>
                        </div>
                    </div>
                </div>
                <div className="save-button-container">
                    <button type="submit" className="btn-save">Save Changes</button>
                </div>
            </form>
        </section>
    );
}

// --- Change Password Form Component ---
function ChangePasswordForm() {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', content: 'New passwords do not match.' });
            return;
        }
        if (passwords.newPassword.length < 6) {
             setMessage({ type: 'error', content: 'New password must be at least 6 characters.' });
             return;
        }

        setLoading(true);
        console.log("Changing password:", passwords);
        // TODO: Implement API call to backend to change password
        // try {
        //    await changePasswordApi({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
        //    setMessage({ type: 'success', content: 'Password changed successfully!' });
        //    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear fields
        // } catch (error) {
        //    setMessage({ type: 'error', content: error.response?.data?.message || 'Failed to change password.' });
        // } finally {
        //    setLoading(false);
        // }

        // --- Placeholder ---
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setMessage({ type: 'success', content: 'Password changed successfully! (Placeholder)' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setLoading(false);
        // --- End Placeholder ---
    };

    return (
        <section className="settings-card">
             <h2 className="settings-card-title">Change password</h2>
             <form onSubmit={handleSubmit} className="password-form-section">
                <div className="password-input-group">
                     <div>
                       <label htmlFor="currentPassword" className="form-label">Current password</label>
                       <input type="password" id="currentPassword" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required className="form-input"/>
                     </div>
                     <div>
                       <label htmlFor="newPassword" className="form-label">New password</label>
                       <input type="password" id="newPassword" name="newPassword" value={passwords.newPassword} onChange={handleChange} required className="form-input"/>
                     </div>
                     <div>
                       <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
                       <input type="password" id="confirmPassword" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required className="form-input"/>
                     </div>
                </div>
                {message.content && (
                  <div style={{ marginTop: '1.5rem' }}
                    className={`form-message ${
                      message.type === 'success'
                        ? 'form-message-success'
                        : 'form-message-error'
                    }`}
                  >
                    {message.content}
                  </div>
                )}
                <div className="save-button-container">
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
            </form>
        </section>
    );
}

// --- Notification Settings Form Component ---
function NotificationSettingsForm() {
    // State for each toggle - get initial values from user settings later
    const [notifications, setNotifications] = useState({
        all: true,
        likes: true,
        messages: true,
        email: false,
    });

    const handleToggle = (key) => {
        setNotifications(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            // If 'all' is toggled, update others accordingly
            if (key === 'all') {
                const allValue = newState.all;
                return { all: allValue, likes: allValue, messages: allValue, email: allValue };
            } else {
                // If any individual toggle is turned off, turn 'all' off
                // If all individual toggles are turned on, turn 'all' on
                const othersOn = newState.likes && newState.messages && newState.email;
                return { ...newState, all: othersOn };
            }
        });
        // TODO: Add API call here to save the updated notification settings
        console.log(`Notification setting changed: ${key}`, !notifications[key]);
    };

    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Notification</h2>
            <div className="notification-settings-list">
                {/* All Notification Toggle */}
                <div className="notification-item">
                    <span className="notification-label">All notification</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={notifications.all}
                            onChange={() => handleToggle('all')}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {/* Like Toggle */}
                <div className="notification-item">
                    <span className="notification-label">Like of my listing</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={notifications.likes}
                            onChange={() => handleToggle('likes')}
                            disabled={notifications.all} // Disable if 'all' is on
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {/* Message Toggle */}
                <div className="notification-item">
                    <span className="notification-label">Message</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={notifications.messages}
                            onChange={() => handleToggle('messages')}
                             disabled={notifications.all}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {/* Email Toggle */}
                <div className="notification-item">
                    <span className="notification-label">Email</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={notifications.email}
                            onChange={() => handleToggle('email')}
                             disabled={notifications.all}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
             {/* Optional: Add a Save button if needed, or save on toggle */}
             {/* <div className="save-button-container">
               <button className="btn-save">Save Notification Settings</button>
             </div> */}
        </section>
    );
}

// --- Theme Settings Form Component ---
function ThemeSettingsForm() {
    // State to track the selected theme. Default to 'light'.
    // In a real app, you'd load the user's preference.
    const [selectedTheme, setSelectedTheme] = useState('light');

    const handleThemeSelect = (theme) => {
        setSelectedTheme(theme);
        // TODO: Apply the theme globally (e.g., add/remove class on <body>)
        // document.body.classList.remove('theme-light', 'theme-dark');
        // document.body.classList.add(`theme-${theme}`);
        // TODO: Add API call to save the user's theme preference
        console.log("Theme selected:", theme);
        alert(`Theme set to ${theme}! (Placeholder - visual change not implemented)`);
    };

    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Theme</h2>
            <div className="theme-options-container">
                {/* Light Theme Box */}
                <div
                    className={`theme-option-box light-theme ${selectedTheme === 'light' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('light')}
                    role="button" // Accessibility
                    tabIndex={0} // Make it focusable
                    aria-pressed={selectedTheme === 'light'} // Accessibility
                >
                    {/* Simple visual preview */}
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-line"></div>
                    <div className="theme-preview-line short"></div>
                    <div className="theme-option-label">Light</div>
                </div>

                {/* Dark Theme Box */}
                <div
                    className={`theme-option-box dark-theme ${selectedTheme === 'dark' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('dark')}
                    role="button"
                    tabIndex={0}
                     aria-pressed={selectedTheme === 'dark'}
                >
                    {/* Simple visual preview */}
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-line"></div>
                    <div className="theme-preview-line short"></div>
                    <div className="theme-option-label">Dark</div>
                </div>
            </div>
             {/* Optional: Add a Save button if selection doesn't save immediately */}
             {/* <div className="save-button-container">
               <button className="btn-save">Save Theme Preference</button>
             </div> */}
        </section>
    );
}


// --- Main Settings Page Component ---
export default function SettingsPage() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // State only for the Edit Profile form data
  const [profileData, setProfileData] = useState({
    fullName: '',
    address: '',
    schoolName: '',
    bio: '',
    email: '',
    phoneNumber: '',
  });

  // Determine active setting based on URL
  const getActiveSetting = () => {
      if (location.pathname.includes('/password')) return 'change-password';
      if (location.pathname.includes('/notifications')) return 'notification';
      if (location.pathname.includes('/theme')) return 'theme';
      return 'edit-profile'; // Default
  };
  const activeSetting = getActiveSetting();

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCurrentUser();
        const fetchedUser = response.data;
        setUserData(fetchedUser);
        // Pre-fill profile form state
        setProfileData({
          fullName: fetchedUser.fullName || '',
          address: fetchedUser.address || '',
          schoolName: fetchedUser.school?.name || 'N/A', // Assumes school is populated or available
          bio: fetchedUser.bio || '', // Assuming bio field exists
          email: fetchedUser.email || '',
          phoneNumber: fetchedUser.phoneNumber || '',
        });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Could not load user data.");
        // Redirect to login if token is invalid/missing
        if (err.message === "No authentication token found.") {
           navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  // Handler for changes in the Edit Profile form
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({ ...prevData, [name]: value }));
  };

  // Handler for saving Edit Profile form
  const handleProfileSave = (e) => {
    e.preventDefault();
    console.log("Saving profile changes:", profileData);
    // TODO: Implement API call to update user profile
    alert("Profile changes saved! (Placeholder)");
  };

  // Handler for logout button in Header
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // Render loading state
  if (isLoading) {
     return (
        // Use profile-page class for consistent header height/styles if needed
        <div className="profile-page">
            <Header userName="" onLogout={handleLogout} />
            {/* Render the skeleton component */}
            <SettingsSkeleton />
        </div>
     );
  }

  // Render error state
   if (error) {
     return (
        <div className="settings-page">
            <Header userName="" onLogout={handleLogout} />
            <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
        </div>
     );
  }

  // Main render
  return (
    // Reuse profile-page class for header/overall page structure if desired
    <div className="profile-page">
      <Header userName={userData?.fullName?.split(' ')[0]} onLogout={handleLogout} />

      <div className="settings-page"> {/* Container for sidebar + content */}
        {/* Left Sidebar */}
        <aside className="settings-sidebar">
          <nav>
            <ul className="settings-nav-list">
              <li className="settings-nav-item">
                <Link to="/settings/profile" className={activeSetting === 'edit-profile' ? 'active' : ''}>Edit Profile</Link>
              </li>
              <li className="settings-nav-item">
                <Link to="/settings/password" className={activeSetting === 'change-password' ? 'active' : ''}>Change Password</Link>
              </li>
              <li className="settings-nav-item">
                <Link to="/settings/notifications" className={activeSetting === 'notification' ? 'active' : ''}>Notification</Link>
              </li>
              <li className="settings-nav-item">
                <Link to="/settings/theme" className={activeSetting === 'theme' ? 'active' : ''}>Theme</Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content Area - Render based on activeSetting */}
        <main className="settings-content">
          {activeSetting === 'edit-profile' && (
            <EditProfileForm
                userData={userData}
                profileData={profileData}
                onChange={handleProfileChange}
                onSave={handleProfileSave}
            />
          )}
          {activeSetting === 'change-password' && (
            <ChangePasswordForm />
          )}
          {activeSetting === 'notification' && (
            <NotificationSettingsForm />
          )}
          {activeSetting === 'theme' && (
            <ThemeSettingsForm />
          )}
        </main>
      </div>
    </div>
  );
}