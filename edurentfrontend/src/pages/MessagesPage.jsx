import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import { 
  getCurrentUser, 
  getListingById,
  likeListing,     
  unlikeListing    
} from '../services/apiService';

// Import CSS
import '../static/MessagesPage.css'; // Make sure this is the correct path

// --- NEW: SVG Icons Object ---
const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  ),
  BackArrow: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  ),
  Attachment: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
    </svg>
  )
};

// --- Skeleton Component ---
function MessagesSkeleton() {
  return (
    <div className="messages-skeleton-container">
      <aside className="skeleton-conversations-sidebar">
        <div className="skeleton skeleton-conversation-header"></div>
        <div className="skeleton skeleton-conversation-search"></div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton-conversation-item">
            <div className="skeleton skeleton-conversation-avatar"></div>
            <div className="skeleton-conversation-details">
              <div className="skeleton skeleton-conversation-line" style={{ width: '60%' }}></div>
              <div className="skeleton skeleton-conversation-line" style={{ width: '80%' }}></div>
            </div>
          </div>
        ))}
      </aside>
      <main className="skeleton-chat-area">
        <p>Loading Conversations...</p>
      </main>
    </div>
  );
}

// --- Mock Data (Replace with API fetch later) ---
const MOCK_CONVERSATIONS = [
  {
    id: 1,
    otherUser: { id: 101, name: 'Jane Doe', avatar: null },
    product: { id: 2, title: 'Bluetooth Headphones', price: 25, icon: '🎧' },
    lastMessagePreview: 'Okay, sounds good!',
    messages: [
      { id: 10, senderId: 101, text: 'Hi! Is the headphone still available for rent?', timestamp: '10:30 AM' },
      { id: 11, senderId: 5, text: 'Yes, it is!', timestamp: '10:31 AM' }, // Assume current user ID is 5
      { id: 12, senderId: 101, text: 'Great! Can I pick it up tomorrow around 2 PM?', timestamp: '10:32 AM' },
      { id: 13, senderId: 5, text: 'Okay, sounds good!', timestamp: '10:33 AM' },
    ]
  },
  {
    id: 2,
    otherUser: { id: 102, name: 'Mike Ross', avatar: null },
    product: { id: 1, title: 'Intro to CS Textbook', price: 45, icon: '📚' },
    lastMessagePreview: 'Thanks!',
    messages: [
      { id: 20, senderId: 102, text: 'Hello, wondering about the condition of the CS book?', timestamp: 'Yesterday' },
      { id: 21, senderId: 5, text: 'It\'s in excellent condition, almost like new.', timestamp: 'Yesterday' },
      { id: 22, senderId: 102, text: 'Thanks!', timestamp: 'Yesterday' },
    ]
  },
    {
    id: 3,
    otherUser: { id: 103, name: 'Alice', avatar: null },
    product: { id: 6, title: 'Microscope', price: 50, icon: '🔬' },
    lastMessagePreview: 'Is the price negotiable?',
    messages: [
        { id: 30, senderId: 103, text: 'Is the price negotiable?', timestamp: '2 days ago' },
    ]
  },
];

// Assume current user's ID
const CURRENT_USER_ID = 5;

export default function MessagesPage() {
  const [userName, setUserName] = useState('');
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS); // All conversations
  const [filteredConversations, setFilteredConversations] = useState(MOCK_CONVERSATIONS); // Filtered list
  const [selectedConversation, setSelectedConversation] = useState(null); // The active chat
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const [error, setError] = useState(null); // Added error state

  // --- ADD THIS BLOCK ---
  const [userData, setUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  
  // Like State (needed for the modal)
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isNotificationLoading, setIsNotificationLoading] = useState(false); 
  // --- END BLOCK ---
  
  // --- NEW: State for mobile view ---
  const [isChatVisible, setIsChatVisible] = useState(false);

  const navigate = useNavigate();
  const chatContentRef = useRef(null);
  // --- NEW: Ref for auto-growing textarea ---
  const textareaRef = useRef(null);

  // --- Fetch User Data ---
  useEffect(() => {
    const fetchUser = async () => {
        setIsLoading(true);
        setError(null);
      try {
        const userResponse = await getCurrentUser();
        if (userResponse.data && userResponse.data.fullName) {
          setUserData(userResponse.data);
          setUserName(userResponse.data.fullName.split(' ')[0]);
        }
        // TODO: Fetch actual conversations from API
        // const convResponse = await getConversations();
        // setConversations(convResponse.data);
        // setFilteredConversations(convResponse.data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Could not load messages."); // Set error message
        if (err.message === "No authentication token found.") {
            navigate('/login');
        }
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    fetchUser();
  }, [navigate]);

  // --- Scroll to bottom when selected conversation changes or messages update ---
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages.length]); // Re-run when message count changes

  // --- Search Handler ---
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = conversations.filter(conv =>
      conv.otherUser.name.toLowerCase().includes(query) ||
      conv.product.title.toLowerCase().includes(query) ||
      conv.lastMessagePreview.toLowerCase().includes(query)
    );
    setFilteredConversations(filtered);
  };

  // --- Select Conversation Handler ---
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setIsChatVisible(true); // --- NEW: Show chat view on mobile ---
  };

  // --- NEW: Handler to go back to list on mobile ---
  const handleBackToList = () => {
    setIsChatVisible(false);
  };

  // --- NEW: Textarea Change Handler (for auto-growing) ---
  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to content height
    }
  };

  // --- Send Message Handler (Placeholder) ---
  const handleSendMessage = () => {
      if (!newMessage.trim() || !selectedConversation) return;

      console.log(`Sending message "${newMessage}" to conversation ${selectedConversation.id}`);
      // TODO: Implement API call to send message
      // try {
      //     await sendMessageApi(selectedConversation.id, newMessage);
            // Optimistic update (add message locally, then update if API fails)
            const messageToSend = {
                id: Date.now(), // Temporary ID
                senderId: CURRENT_USER_ID,
                text: newMessage,
                timestamp: 'Just now'
            };
            // Update the state
            setSelectedConversation(prev => ({
                ...prev,
                messages: [...prev.messages, messageToSend]
            }));
            // Update the main conversations list preview (optional)
            setConversations(prevConvs => prevConvs.map(c =>
              c.id === selectedConversation.id ? {...c, lastMessagePreview: newMessage} : c
            ));
            setFilteredConversations(prevConvs => prevConvs.map(c =>
              c.id === selectedConversation.id ? {...c, lastMessagePreview: newMessage} : c
            ));
            setNewMessage(''); // Clear input

            // --- NEW: Reset textarea height after sending ---
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
      // } catch (error) { console.error("Failed to send message", error); }
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- NEW Universal Notification Click Handler ---
  const handleNotificationClick = async (notification) => {
    console.log("Notification clicked:", notification);

    // 1. Extract the listing ID from the notification's URL
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) {
      console.error("Could not parse listingId from notification linkUrl:", notification.linkUrl);
      alert("Could not open this notification: Invalid link.");
      return;
    }

    closeModal(); // Close any modal that's already open
    setIsNotificationLoading(true); // <-- SHOW THE SKELETON

    console.log(`Fetching details for listingId: ${listingId}`);

    try {
      // 2. Fetch that specific listing's data from the API
      // We must have `getListingById` imported from apiService.js
      const response = await getListingById(listingId); 

      if (response.data) {
        // 3. We found the listing! Call openModal with the data.
        openModal(response.data);
      } else {
        throw new Error(`Listing ${listingId} not found.`);
      }

    } catch (err) {
      console.error("Failed to fetch listing for notification:", err);
      alert(`Could not load item: ${err.message}. It may have been deleted.`);
      // As a fallback, navigate to the main browse page
      navigate('/browse');
    } finally {
      setIsNotificationLoading(false); // <-- HIDE THE SKELETON
    }
  };
  // --- End new function ---

  // Modal Handlers
  const openModal = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedListing(null);
    setIsModalOpen(false);
  };

  // Like Handler (copied from Dashboard/Manage)
  const handleLikeToggle = async (listingId) => {
    if (likingInProgress.has(listingId)) return;
    setLikingInProgress(prev => new Set(prev).add(listingId));
    
    const newLikedIds = new Set(likedListingIds);
    const isCurrentlyLiked = likedListingIds.has(listingId);
    
    if (isCurrentlyLiked) {
      newLikedIds.delete(listingId);
    } else {
      newLikedIds.add(listingId);
    }
    setLikedListingIds(newLikedIds);
    
    try {
      if (isCurrentlyLiked) {
        await unlikeListing(listingId);
      } else {
        await likeListing(listingId);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert state
      setLikedListingIds(prevIds => {
          const revertedIds = new Set(prevIds);
          if (isCurrentlyLiked) {
            revertedIds.add(listingId);
          } else {
            revertedIds.delete(listingId);
          }
          return revertedIds;
      });
    } finally {
      setLikingInProgress(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    }
  };

  // --- Render Loading/Error ---
  if (isLoading) {
      return (
        <div className="profile-page"> {/* Container for Header */}
            <Header userName="" onLogout={handleLogout} />
            {/* Render the Messages Skeleton */}
            <MessagesSkeleton />
        </div>
      );
  }
  if (error) {
      return (
        <div className="profile-page">
            <Header userName={userName} onLogout={handleLogout} />
            <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
        </div>
      );
  }

  // --- Render Messages Page ---
  return (
    <div className="profile-page"> {/* Reuse class for header consistency */}
      <Header userName={userName} 
      profilePictureUrl={userData?.profilePictureUrl}
      onLogout={handleLogout} 
      onNotificationClick={handleNotificationClick}
      />

      <div className="messages-page-container">
        {/* Left Sidebar */}
        <aside className={`conversations-sidebar ${isChatVisible ? 'mobile-hidden' : ''}`}>
          <div className="conversations-header">
            <h1 className="conversations-title">Messages</h1>
            <div className="conversation-search-bar">
              <span className="conversation-search-icon"><Icons.Search /></span>
              <input
                type="text"
                className="conversation-search-input"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <ul className="conversations-list">
            {filteredConversations.map(conv => (
              <li
                key={conv.id}
                className={`conversation-list-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conv)}
                role="button"
                tabIndex={0}
                aria-current={selectedConversation?.id === conv.id ? 'page' : undefined}
              >
                <div className="conversation-avatar">
                  {/* Placeholder for avatar image */}
                </div>
                <div className="conversation-details">
                  <div className="conversation-user-name">{conv.otherUser.name}</div>
                  <div className="conversation-preview">{conv.lastMessagePreview}</div>
                </div>
              </li>
            ))}
              {filteredConversations.length === 0 && (
                <li style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No conversations found.
                </li>
            )}
          </ul>
        </aside>

        {/* Right Chat Area */}
        <main className={`chat-area ${!selectedConversation ? 'no-chat-selected' : ''} ${isChatVisible ? 'mobile-visible' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                {/* --- NEW: Back button for mobile --- */}
                <button className="chat-back-button" onClick={handleBackToList}>
                  <Icons.BackArrow />
                </button>
                <div className="chat-user-info">
                  <span className="user-name">{selectedConversation.otherUser.name}</span>
                  {/* Optional: Add online status indicator */}
                </div>
                {selectedConversation.product && (
                  <div className="chat-product-info">
                    <span className="product-info-icon">{selectedConversation.product.icon || '📦'}</span>
                    <div className="product-info-details">
                      <div className="product-info-title">{selectedConversation.product.title}</div>
                      <div className="product-info-price">${selectedConversation.product.price}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Content */}
              <div className="chat-content" ref={chatContentRef}>
                {selectedConversation.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message-bubble-wrapper ${msg.senderId === CURRENT_USER_ID ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                    {/* --- MODIFIED: Added timestamp --- */}
                    <span className="message-timestamp">{msg.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="chat-input-area">
                <textarea
                  ref={textareaRef} // --- NEW: Attach ref
                  className="chat-input"
                  placeholder="Type here..."
                  value={newMessage}
                  onChange={handleTextareaChange} // --- MODIFIED: Use new handler
                  onKeyPress={(e) => {
                      // Send message on Enter key press (optional)
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault(); // Prevent newline
                          handleSendMessage();
                      }
                  }}
                  rows={1} // Start with 1 row, CSS handles basic height
                />
                
                {/* --- NEW: Conditional Send/Attachment Button --- */}
                {newMessage.trim() ? (
                  <button className="icon-button send-button" onClick={handleSendMessage} aria-label="Send message">
                    <Icons.Send />
                  </button>
                ) : (
                  <button className="icon-button" aria-label="Attach file">
                    <Icons.Attachment />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-conversation-selected">
              <span className="no-conversation-icon">💬</span>
              <h2>Select a conversation</h2>
              <p>Choose a chat from the left to start messaging.</p>
            </div>
          )}
        </main>
      </div>
      {isModalOpen && selectedListing && (
        <ProductDetailModal
          listing={selectedListing}
          onClose={closeModal}
          currentUserId={userData?.userId}
          isLiked={likedListingIds.has(selectedListing.listingId)}
          onLikeClick={handleLikeToggle}
          isLiking={likingInProgress.has(selectedListing.listingId)}
        />
      )}
      {isNotificationLoading && (
        <ProductDetailModalSkeleton onClose={() => setIsNotificationLoading(false)} />
      )}
    </div>
  );
}