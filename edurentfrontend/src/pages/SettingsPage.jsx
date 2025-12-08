import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Custom hooks for managing auth state, likes, and global UI logic
import useAuth from '../hooks/useAuth'; 
import useLikes from '../hooks/useLikes'; 
import usePageLogic from '../hooks/usePageLogic'; 

// Components
import Header from '../components/Header';
import defaultAvatar from '../assets/default-avatar.png';

// API & Services
import { 
  getCurrentUser, 
  updateUserProfile,
  changePassword,
  getNotificationPreferences,
  upsertNotificationPreferences,
} from '../services/apiService';
import { supabase } from '../supabaseClient';

// Styles
import '../static/SettingsPage.css';

// A loading skeleton to keep the UI stable while fetching user data
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

// Handles editing public profile info and uploading a new avatar
function EditProfileForm({ userData, profileData, onChange, onSave, onPickPhoto, uploading }) {
  
  // Logic to decide which image to display: the new upload, the existing one, or a default
  const getProfileSrc = () => {
    // 1. Show the newly uploaded preview if available
    if (profileData.profilePictureUrl) return profileData.profilePictureUrl;
    
    // 2. Show the existing photo from the database
    if (userData?.profilePictureUrl) {
        // Check if it's already a full URL (Supabase) or needs the backend host (Local)
        if (userData.profilePictureUrl.startsWith('http')) {
            return userData.profilePictureUrl;
        }
        return `http://localhost:8080${userData.profilePictureUrl}`;
    }
    
    // 3. Fallback to default
    return defaultAvatar;
  };

    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Edit Profile</h2>
            <div className="profile-photo-section">
                <div className="profile-photo-container">
                  <img
                    src={getProfileSrc()} 
                    alt="Profile"
                    className="profile-photo-placeholder"
                    style={{ objectFit: 'cover' }}
                  />
                  
                  {/* Show a spinner overlay while the image uploads */}
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

// Allows the user to change their password
function ChangePasswordForm({ userEmail }) {
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [email] = useState(userEmail || '');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const validateStrength = (pwd) => {
      // Basic strength rule: min 8 chars with a number
      const minLen = pwd.length >= 8;
      const hasNumber = /\d/.test(pwd);
      return minLen && hasNumber;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', content: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', content: 'New passwords do not match.' });
            return;
        }
        if (!validateStrength(passwords.newPassword)) {
             setMessage({ type: 'error', content: 'New password must be at least 8 characters and include a number.' });
             return;
        }

        setLoading(true);
        try {
          // Delegate to backend: verifies current and updates to new
          await changePassword(passwords.currentPassword, passwords.newPassword);
          setMessage({ type: 'success', content: 'Password changed successfully!' });
          setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
          console.error('Password change failed:', err);
          const serverMsg = err?.response?.data?.message;
          setMessage({ type: 'error', content: serverMsg || 'Failed to change password.' });
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
                        <div className="form-hint" style={{ marginTop: '0.4rem' }}>Use at least 8 characters and include a number.</div>
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

// Manages notification preferences
function NotificationSettingsForm({ userId }) {
    const [notifications, setNotifications] = useState({
        all: true,
        likes: true,
        messages: true,
        email: false,
    });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing preferences from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadPrefs = async () => {
      if (!userId) return;
      try {
        const prefs = await getNotificationPreferences(userId);
        if (!isMounted) return;
        setNotifications({
          all: !!prefs.all_notifications,
          likes: !!prefs.likes,
          messages: !!prefs.messages,
          email: !!prefs.email,
        });
        setLoaded(true);
      } catch (e) {
        console.error('Failed to load notification preferences:', e);
      }
    };
    loadPrefs();
    return () => { isMounted = false; };
  }, [userId]);

  const persist = async (state) => {
    if (!userId) return;
    setSaving(true);
    try {
      await upsertNotificationPreferences({
        user_id: userId,
        all_notifications: state.all,
        likes: state.likes,
        messages: state.messages,
        email: state.email,
      });
    } catch (e) {
      console.error('Failed to save notification preferences:', e);
    } finally {
      setSaving(false);
    }
  };

    const handleToggle = (key) => {
        setNotifications(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            
            // Logic to sync "All notifications" switch with sub-switches
            if (key === 'all') {
                const allValue = newState.all;
            const next = { all: allValue, likes: allValue, messages: allValue, email: allValue };
            persist(next);
            return next;
            } else {
                const othersOn = newState.likes && newState.messages && newState.email;
            const next = { ...newState, all: othersOn };
            persist(next);
            return next;
            }
        });
    };

    return (
        <section className="settings-card">
            <h2 className="settings-card-title">Notification</h2>
            <div className="notification-settings-list">
                <div className="notification-item">
                    <span className="notification-label">All notification</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.all} onChange={() => handleToggle('all')} disabled={!loaded || saving} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div className="notification-item">
                    <span className="notification-label">Like of my listing</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.likes} onChange={() => handleToggle('likes')} disabled={notifications.all || !loaded || saving} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div className="notification-item">
                    <span className="notification-label">Message</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.messages} onChange={() => handleToggle('messages')} disabled={notifications.all || !loaded || saving} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                <div className="notification-item">
                    <span className="notification-label">Email</span>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={notifications.email} onChange={() => handleToggle('email')} disabled={notifications.all || !loaded || saving} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
                {!loaded && (
                  <div className="form-hint" style={{ marginTop: '0.5rem' }}>Loading preferences…</div>
                )}
                {saving && (
                  <div className="form-hint" style={{ marginTop: '0.5rem' }}>Saving…</div>
                )}
            </div>
        </section>
    );
}

// Allows switching between Light and Dark mode
function ThemeSettingsForm() {
    const [selectedTheme, setSelectedTheme] = useState('light');

    const handleThemeSelect = (theme) => {
        setSelectedTheme(theme);
        // TO DO: Implement the actual theme switching logic (e.g., toggle CSS classes on body)
        // TO DO: Save user preference to LocalStorage
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
  const { retryAuth, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Local state for the edit profile form
  const [profileData, setProfileData] = useState({
    fullName: '',
    address: '',
    schoolName: '',
    bio: '',
    email: '',
    phoneNumber: '',
    profilePictureUrl: '',
  });

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Connect shared logic for notifications
  const likesHook = useLikes();
  const { 
    handleNotificationClick, 
    ModalComponent, 
  } = usePageLogic(userData, likesHook);

  // Determine which tab is active based on the URL path
  const activeSetting = (() => {
      if (location.pathname.includes('/password')) return 'change-password';
      if (location.pathname.includes('/notifications')) return 'notification';
      if (location.pathname.includes('/theme')) return 'theme';
      return 'edit-profile';
  })();

  // Fetch current user details when the page loads
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCurrentUser();
        const fetchedUser = response.data;
        setUserData(fetchedUser);
        
        // Fill the form with existing data
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({ ...prevData, [name]: value }));
  };

  // Handles uploading the new avatar image to Supabase storage
  const handleUploadPhoto = async (file) => {
    if (!file || !userData?.userId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      // Create a unique path for the user's image
      const path = `${userData.userId}/${Date.now()}.${ext}`;

      // TO DO: Ensure the 'profile-images' bucket exists in Supabase and has public read access
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

      // Update the preview immediately
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
        profilePictureUrl: profileData.profilePictureUrl 
      };

      // 1. Send update to the backend
      const res = await updateUserProfile(payload);
      
      // 2. Update local component state
      setUserData(res.data);

      // 3. Refresh global auth state so the Header updates immediately
      await retryAuth();

      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  
  if (isLoading) {
     return (
       <div className="profile-page">
          <Header userName="" onLogout={logout} />
          <SettingsSkeleton />
       </div>
     );
  }

   if (error) {
     return (
       <div className="profile-page">
          <Header userName="" onLogout={logout} />
          <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
       </div>
     );
  }

  return (
    <div className="profile-page">
      <Header userName={userData?.fullName?.split(' ')[0]} 
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout} 
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

        {/* Main Content Area switches based on the active route */}
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
          {activeSetting === 'change-password' && (
            <ChangePasswordForm userEmail={userData?.email} />
          )}
          {activeSetting === 'notification' && (
            <NotificationSettingsForm userId={userData?.userId} />
          )}
          {activeSetting === 'theme' && <ThemeSettingsForm />}
        </main>
      </div>

      {/* Hidden container for shared modal logic */}
      <ModalComponent />

      {/* Invisible input used for uploading profile pictures */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
                handleUploadPhoto(e.target.files[0]);
            }
            e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}