import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// --- Custom Hooks ---
import useAuth from '../hooks/useAuth'; // Provides authentication state and retryAuth
import useLikes from '../hooks/useLikes'; // Manages liking logic
import usePageLogic from '../hooks/usePageLogic'; // Manages shared page logic (Modals, Notifications)

// --- Components ---
import Header from '../components/Header';
import defaultAvatar from '../assets/default-avatar.png';

// --- API & Services ---
import { 
  getCurrentUser, 
  updateUserProfile 
} from '../services/apiService';
import { supabase } from '../supabaseClient';

// --- Styles ---
import '../static/SettingsPage.css';

// --- SKELETON LOADER ---
function SettingsSkeleton() {
  return (
    <div className="settings-skeleton-container">
      {/* Sidebar Skeleton */}
      <aside className="settings-sidebar" style={{ borderRight: '1px solid #eee' }}>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '70%' }}></div>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '80%' }}></div>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-sidebar-item" style={{ width: '75%' }}></div>
      </aside>
      {/* Content Skeleton */}
      <main className="settings-content">
        <div className="skeleton skeleton-settings-card"></div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS (FORMS) ---

/**
 * Form for editing public and private profile details.
 * Includes image upload preview and loading states.
 */
function EditProfileForm({ userData, profileData, onChange, onSave, onPickPhoto, uploading }) {
  // Helper to determine the correct image source
const getProfileSrc = () => {
    // 1. If user just uploaded a new photo, show that immediately
    if (profileData.profilePictureUrl) return profileData.profilePictureUrl;
    
    // 2. If user has an existing photo
    if (userData?.profilePictureUrl) {
        // If it's an absolute URL (from Supabase), use it as is
        if (userData.profilePictureUrl.startsWith('http')) {
            return userData.profilePictureUrl;
        }
        // If it's a relative path (from local uploads), prepend backend URL
        return `http://localhost:8080${userData.profilePictureUrl}`;
    }
    
    // 3. Fallback
    return defaultAvatar;
};
    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Edit Profile</h2>
            <div className="profile-photo-section">
                <div className="profile-photo-container">
                  {/* Display the new image immediately if profileData has it, otherwise fallback to userData */}
                  <img
                    src={
                      profileData.profilePictureUrl 
                      || (userData?.profilePictureUrl ? `http://localhost:8080${userData.profilePictureUrl}` : null) 
                      || (userData?.profilePictureUrl && userData.profilePictureUrl.startsWith('http') ? userData.profilePictureUrl : defaultAvatar)
                    }
                    alt="Profile"
                    className="profile-photo-placeholder"
                    style={{ objectFit: 'cover' }}
                  />
                  
                  {/* Loading Overlay */}
                  {uploading && (
                    <div style={{ 
                        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' 
                    }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>...</span>
                    </div>
                  )}

                  <button type="button" className="edit-icon-overlay" title="Change photo" onClick={onPickPhoto} disabled={uploading}>
                    ✏️
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Profile Picture</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {uploading ? 'Uploading...' : 'PNG, JPG up to 5MB'}
                    </span>
                </div>
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
                    <button type="submit" className="btn-save" disabled={uploading}>
                        {uploading ? 'Uploading Image...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </section>
    );
}

/**
 * Form for changing user password.
 * Currently simulates an API call.
 */
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

        // Basic Validation
        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', content: 'New passwords do not match.' });
            return;
        }
        if (passwords.newPassword.length < 6) {
             setMessage({ type: 'error', content: 'New password must be at least 6 characters.' });
             return;
        }

        setLoading(true);
        
        // TODO: Implement actual API call to backend endpoint (e.g., /api/user/change-password)
        try {
           // Simulate network delay
           await new Promise(resolve => setTimeout(resolve, 1000)); 
           setMessage({ type: 'success', content: 'Password changed successfully! (Placeholder)' });
           setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
           setMessage({ type: 'error', content: 'Failed to change password.' });
        } finally {
           setLoading(false);
        }
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
                  <div style={{ marginTop: '1.5rem' }} className={`form-message ${message.type === 'success' ? 'form-message-success' : 'form-message-error'}`}>
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

/**
 * Form for toggling notification preferences.
 */
function NotificationSettingsForm() {
    const [notifications, setNotifications] = useState({
        all: true,
        likes: true,
        messages: true,
        email: false,
    });

    const handleToggle = (key) => {
        setNotifications(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            
            // Logic: If 'all' is toggled, update sub-items. If sub-items toggle, check if 'all' should change.
            if (key === 'all') {
                const allValue = newState.all;
                return { all: allValue, likes: allValue, messages: allValue, email: allValue };
            } else {
                const othersOn = newState.likes && newState.messages && newState.email;
                return { ...newState, all: othersOn };
            }
        });
        // TODO: Add API call here to persist notification settings (e.g., /api/user/settings/notifications)
        console.log(`Notification setting changed: ${key}`, !notifications[key]);
    };

    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Notification</h2>
            <div className="notification-settings-list">
                <div className="notification-item">
                    <span className="notification-label">All notification</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.all} onChange={() => handleToggle('all')} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div className="notification-item">
                    <span className="notification-label">Like of my listing</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.likes} onChange={() => handleToggle('likes')} disabled={notifications.all} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div className="notification-item">
                    <span className="notification-label">Message</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.messages} onChange={() => handleToggle('messages')} disabled={notifications.all} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div className="notification-item">
                    <span className="notification-label">Email</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.email} onChange={() => handleToggle('email')} disabled={notifications.all} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </section>
    );
}

/**
 * Form for theme selection (Light/Dark).
 */
function ThemeSettingsForm() {
    const [selectedTheme, setSelectedTheme] = useState('light');

    const handleThemeSelect = (theme) => {
        setSelectedTheme(theme);
        // TODO: Save theme preference to LocalStorage or Database
        // TODO: Apply class to document.body to actually switch theme
        console.log("Theme selected:", theme);
        alert(`Theme set to ${theme}! (Visuals not implemented yet)`);
    };

    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Theme</h2>
            <div className="theme-options-container">
                <div 
                    className={`theme-option-box light-theme ${selectedTheme === 'light' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('light')}
                    role="button" tabIndex={0}
                >
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-line"></div>
                    <div className="theme-preview-line short"></div>
                    <div className="theme-option-label">Light</div>
                </div>

                <div 
                    className={`theme-option-box dark-theme ${selectedTheme === 'dark' ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect('dark')}
                    role="button" tabIndex={0}
                >
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-line"></div>
                    <div className="theme-preview-line short"></div>
                    <div className="theme-option-label">Dark</div>
                </div>
            </div>
        </section>
    );
}

// --- MAIN PAGE COMPONENT ---
export default function SettingsPage() {
  const { retryAuth } = useAuth(); // Hook to update global auth state after profile changes
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // --- Profile Form State ---
  const [profileData, setProfileData] = useState({
    fullName: '',
    address: '',
    schoolName: '',
    bio: '',
    email: '',
    phoneNumber: '',
    profilePictureUrl: '',
  });

  // --- File Upload State ---
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // --- Modal & Notification Logic (via Custom Hooks) ---
  const likesHook = useLikes();
  const { 
    openModal, 
    handleNotificationClick, 
    ModalComponent, // This component handles the rendering of modals
    isModalOpen // Extracted in case specific logic needs it
  } = usePageLogic(userData, likesHook);

  // --- Routing: Determine Active Tab ---
  const activeSetting = (() => {
      if (location.pathname.includes('/password')) return 'change-password';
      if (location.pathname.includes('/notifications')) return 'notification';
      if (location.pathname.includes('/theme')) return 'theme';
      return 'edit-profile';
  })();

  // --- Effect: Fetch User Data ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCurrentUser();
        const fetchedUser = response.data;
        setUserData(fetchedUser);
        
        // Populate form data
        setProfileData({
          fullName: fetchedUser.fullName || '',
          address: fetchedUser.address || '',
          schoolName: fetchedUser.school?.name || 'N/A',
          bio: fetchedUser.bio || '',
          email: fetchedUser.email || '',
          phoneNumber: fetchedUser.phoneNumber || '',
          profilePictureUrl: fetchedUser.profilePictureUrl || '',
        });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Could not load user data.");
        if (err.message === "No authentication token found.") {
           navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  // --- Handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({ ...prevData, [name]: value }));
  };

  // Upload Logic: Uploads to Supabase 'profile-images' bucket
  const handleUploadPhoto = async (file) => {
    if (!file || !userData?.userId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      // Path format: userId/timestamp.ext
      const path = `${userData.userId}/${Date.now()}.${ext}`;

      // TODO: Ensure a bucket named 'profile-images' exists in your Supabase project
      const { error: uploadError } = await supabase.storage
        .from('profile-images') 
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path);
      
      const publicUrl = data.publicUrl;
      console.log("New Profile Pic URL:", publicUrl);

      // Update local preview immediately
      setProfileData(prev => ({ ...prev, profilePictureUrl: publicUrl }));
      
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: profileData.fullName,
        address: profileData.address,
        bio: profileData.bio,
        phoneNumber: profileData.phoneNumber,
        profilePictureUrl: profileData.profilePictureUrl // New URL from Supabase
      };

      // 1. Update Backend
      const res = await updateUserProfile(payload);
      
      // 2. Update Local State
      setUserData(res.data);

      // 3. Refresh Global Auth Context (Header update)
      await retryAuth();

      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Render ---
  if (isLoading) {
     return (
        <div className="profile-page">
           <Header userName="" onLogout={handleLogout} />
           <SettingsSkeleton />
        </div>
     );
  }

   if (error) {
     return (
        <div className="profile-page">
           <Header userName="" onLogout={handleLogout} />
           <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
        </div>
     );
  }

  return (
    <div className="profile-page">
      {/* Header with Notification Handler passed from hook */}
      <Header userName={userData?.fullName?.split(' ')[0]} 
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={handleLogout}
        onNotificationClick={handleNotificationClick} 
      />

      <div className="settings-page">
        {/* Sidebar Navigation */}
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

        {/* Dynamic Content Area */}
        <main className="settings-content">
          {activeSetting === 'edit-profile' && (
            <EditProfileForm
                userData={userData}
                profileData={profileData}
                onChange={handleProfileChange}
                onSave={handleProfileSave}
                onPickPhoto={() => fileInputRef.current?.click()}
                uploading={uploading}
            />
          )}
          {activeSetting === 'change-password' && <ChangePasswordForm />}
          {activeSetting === 'notification' && <NotificationSettingsForm />}
          {activeSetting === 'theme' && <ThemeSettingsForm />}
        </main>
      </div>

      {/* Shared Modals Logic (Rendered via Hook Component) */}
      <ModalComponent />

      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
                handleUploadPhoto(e.target.files[0]);
            }
            // Reset value to allow re-selection of the same file
            e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}