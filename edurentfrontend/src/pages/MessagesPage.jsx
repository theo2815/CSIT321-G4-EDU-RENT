import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- Components ---
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import ListingCard from '../components/ListingCard'; 

// --- API Services ---
import { 
  getCurrentUser, 
  getListingById,
  likeListing,       
  unlikeListing,
  getConversationsForUser, 
  getMessages,               
  sendMessage,               
  getLikedListings,
  deleteConversation, 
  archiveConversation 
} from '../services/apiService';

// --- Styles & Assets ---
import '../static/MessagesPage.css';
import defaultAvatar from '../assets/default-avatar.png';

// --- Icons Configuration ---
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
  ),
  ChevronDown: () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
       <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
     </svg>
  ),
  MenuDots: () => ( 
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
      <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
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

// --- Helper Function ---
const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessagesPage() {
  // --- State Management ---
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  const [activeFilter, setActiveFilter] = useState('All Messages');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // --- Chat Action Menu State ---
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isNotificationLoading, setIsNotificationLoading] = useState(false); 
  
  const [isChatVisible, setIsChatVisible] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); 
  const chatContentRef = useRef(null); 
  const textareaRef = useRef(null); 
  const intervalRef = useRef(null); 

  // --- Primary Data Fetching Strategy ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userResponse = await getCurrentUser();
      const currentUser = userResponse.data;
      if (!currentUser) throw new Error("No user data.");
      
      setUserData(currentUser);
      setUserName(currentUser.fullName.split(' ')[0]);
      const userId = currentUser.userId;

      const convResponse = await getConversationsForUser(userId);
      const convs = convResponse.data || [];

      // --- MERGED LOGIC: Robust Processing for Conversations ---
      const processedConvs = convs.map(conv => {
          // Fix: Robust check for participants
          if (!conv.participants) return null;

          // Fix: Robust find logic for 'other user' (handles DTO vs Entity structure)
          const otherParticipant = conv.participants.find(p => {
              const pUserId = p.userId || p.user?.userId || p.user?.id; 
              return pUserId !== userId;
          });
          
          // Get user object (might be direct userDTO or nested user object)
          const otherUserObj = otherParticipant || otherParticipant?.user || {};

          const otherUser = { 
              userId: otherUserObj.userId || otherUserObj.id || 0, 
              fullName: otherUserObj.fullName || otherUserObj.name || 'Unknown User', 
              profilePictureUrl: otherUserObj.profilePictureUrl || otherUserObj.avatar || null 
          };
          
          // Image Extraction
          let productImageUrl = null;
          if (conv.listing) {
               productImageUrl = conv.listing.imageUrl 
                    || (conv.listing.listingImages && conv.listing.listingImages.length > 0 ? conv.listing.listingImages[0].imageUrl : null)
                    || (conv.listing.images && conv.listing.images.length > 0 ? conv.listing.images[0].imageUrl : null);
          }

          return {
              id: conv.conversationId,
              otherUser: {
                  id: otherUser.userId,
                  name: otherUser.fullName,
                  avatar: otherUser.profilePictureUrl
              },
              product: conv.listing ? {
                  ...conv.listing, 
                  id: conv.listing.listingId,
                  title: conv.listing.title,
                  price: conv.listing.price,
                  // Merged Fix: Check both 'owner' and 'user' fields for ownerId
                  ownerId: conv.listing.owner?.userId || conv.listing.user?.userId, 
                  image: productImageUrl, 
                  // Fix: Store URL string, do not render JSX here
                  iconUrl: productImageUrl 
              } : null,
              
              lastMessagePreview: conv.lastMessageContent || 'Start a conversation', 
              lastMessageDate: conv.lastMessageTimestamp || conv.listing?.createdAt,
              
              isUnread: false, 
              isArchived: conv.isArchivedForCurrentUser || false 
          };
      }).filter(Boolean); // Remove nulls

      setConversations(processedConvs);
      
      // Handle Deep Linking
      const passedConvId = location.state?.openConversationId;
      if (passedConvId) {
          const targetConv = processedConvs.find(c => c.id === passedConvId);
          if (targetConv) {
              setSelectedConversation(targetConv);
              setIsChatVisible(true);
              window.history.replaceState({}, document.title);
          }
      }

      const likesResponse = await getLikedListings();
      const likedIds = new Set(likesResponse.data.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch (err) {
      console.error("Failed to fetch messages data:", err);
      setError("Could not load messages.");
      if (err.message === "No authentication token found." || err.response?.status === 401) {
          navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.state]);

  useEffect(() => {
    fetchData();
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // --- Filter Logic ---
  useEffect(() => {
    if (!userData) return;

    let result = conversations;

    if (activeFilter === 'Selling') {
        result = result.filter(c => c.product && c.product.ownerId === userData.userId);
    } else if (activeFilter === 'Buying') {
        result = result.filter(c => c.product && c.product.ownerId !== userData.userId);
    } else if (activeFilter === 'Unread') {
        result = result.filter(c => c.isUnread);
    } else if (activeFilter === 'Archived') {
        result = result.filter(c => c.isArchived);
    } else {
        result = result.filter(c => !c.isArchived); 
    }

    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        result = result.filter(conv =>
          conv.otherUser.name.toLowerCase().includes(query) ||
          (conv.product && conv.product.title.toLowerCase().includes(query))
        );
    }

    setFilteredConversations(result);
  }, [activeFilter, searchQuery, conversations, userData]);

  // --- Message Polling Logic ---
  useEffect(() => {
      if (selectedConversation && userData) {
          const fetchMsgs = async () => {
              try {
                  const response = await getMessages(selectedConversation.id);
                  const mappedMessages = response.data.map(msg => ({
                      id: msg.messageId,
                      senderId: msg.sender?.userId,
                      text: msg.content,
                      timestamp: formatMessageTime(msg.sentAt)
                  }));
                  setMessages(mappedMessages);
              } catch (err) {
                  console.error("Error polling messages:", err);
              }
          };
          fetchMsgs();
          intervalRef.current = setInterval(fetchMsgs, 5000);
          return () => clearInterval(intervalRef.current);
      }
  }, [selectedConversation, userData]);

  // --- Auto-Scroll Logic ---
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);


  // --- UI Handlers ---
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setIsChatVisible(true); 
    setMessages([]); 
    setIsChatMenuOpen(false);
  };

  const handleBackToList = () => {
    setIsChatVisible(false);
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSendMessage = async () => {
      if (!newMessage.trim() || !selectedConversation || !userData) return;

      const textToSend = newMessage;
      setNewMessage(''); 
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      try {
          const tempId = Date.now();
          const optimisticMsg = {
              id: tempId,
              senderId: userData.userId,
              text: textToSend,
              timestamp: formatMessageTime(new Date())
          };
          setMessages(prev => [...prev, optimisticMsg]);

          await sendMessage(textToSend, selectedConversation.id, userData.userId);
          
      } catch (error) { 
          console.error("Failed to send message", error); 
          alert("Failed to send message. Please try again.");
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  const handleNotificationClick = async (notification) => {
    const urlParts = notification.linkUrl?.split('/');
    const listingId = urlParts ? parseInt(urlParts[urlParts.length - 1], 10) : null;

    if (!listingId) return;

    closeModal(); 
    setIsNotificationLoading(true);

    try {
      const response = await getListingById(listingId); 
      if (response.data) {
        setSelectedListing(response.data);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch listing:", err);
      navigate('/browse');
    } finally {
      setIsNotificationLoading(false); 
    }
  };

  // --- Archive Handler ---
  const handleArchiveChat = async () => {
      if (!selectedConversation) return;
      const convId = selectedConversation.id;
      
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, isArchived: !c.isArchived } : c));
      setSelectedConversation(null); 
      setIsChatMenuOpen(false);
      setIsChatVisible(false); 

      try {
          await archiveConversation(convId);
      } catch (err) {
          console.error("Failed to archive:", err);
          alert("Failed to archive conversation.");
          fetchData(); 
      }
  };

  // --- Delete Handler ---
  const handleDeleteChat = async () => {
      if (!selectedConversation) return;
      if (!window.confirm("Are you sure you want to delete this conversation? This cannot be undone.")) return;
      
      const convId = selectedConversation.id;
      
      setConversations(prev => prev.filter(c => c.id !== convId));
      setSelectedConversation(null);
      setIsChatMenuOpen(false);
      setIsChatVisible(false);

      try {
          await deleteConversation(convId);
      } catch (err) {
          console.error("Failed to delete:", err);
          alert("Failed to delete conversation.");
          fetchData(); 
      }
  };

  // --- Modal Logic ---
  const openModal = async (listingSummary) => {
    // The listing object in the chat is a summary. 
    // We must fetch the full details (description, condition, school, etc.) 
    // from the API to display the modal correctly.
    
    const listingId = listingSummary.id || listingSummary.listingId;
    if (!listingId) return;

    setIsNotificationLoading(true); // Show the skeleton loader
    
    try {
      const response = await getListingById(listingId);
      if (response.data) {
        setSelectedListing(response.data); // Set the FULL listing data
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load listing details:", err);
      alert("Could not load item details. It may have been deleted.");
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedListing(null);
  };

  const handleLikeToggle = async (listingId) => {
    if (likingInProgress.has(listingId)) return;
    setLikingInProgress(prev => new Set(prev).add(listingId));
    
    const newLikedIds = new Set(likedListingIds);
    const isCurrentlyLiked = likedListingIds.has(listingId);
    
    if (isCurrentlyLiked) newLikedIds.delete(listingId);
    else newLikedIds.add(listingId);
    setLikedListingIds(newLikedIds);
    
    try {
      if (isCurrentlyLiked) await unlikeListing(listingId);
      else await likeListing(listingId);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLikedListingIds(prevIds => {
          const revertedIds = new Set(prevIds);
          if (isCurrentlyLiked) revertedIds.add(listingId);
          else revertedIds.delete(listingId);
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

  // --- Render ---
  if (isLoading) {
      return (
        <div className="profile-page">
            <Header userName="" onLogout={handleLogout} />
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

  const filterOptions = ['All Messages', 'Selling', 'Buying', 'Unread', 'Archived'];

  return (
    <div className="profile-page">
      <Header userName={userName} 
      profilePictureUrl={userData?.profilePictureUrl}
      onLogout={handleLogout} 
      onNotificationClick={handleNotificationClick}
      />

      <div className="messages-page-container">
        {/* Left Sidebar: Conversation List */}
        <aside className={`conversations-sidebar ${isChatVisible ? 'mobile-hidden' : ''}`}>
          <div className="conversations-header">
            <div className="message-filter-container">
                <button 
                    className="message-filter-btn" 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                >
                    {activeFilter} <Icons.ChevronDown />
                </button>
                {isFilterDropdownOpen && (
                    <div className="filter-dropdown-menu">
                        {filterOptions.map(option => (
                            <button 
                                key={option} 
                                className={`filter-option ${activeFilter === option ? 'active' : ''}`}
                                onClick={() => { setActiveFilter(option); setIsFilterDropdownOpen(false); }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>

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
              >
                <div className="conversation-avatar">
                   <img 
                      src={conv.otherUser.avatar ? `http://localhost:8080${conv.otherUser.avatar}` : defaultAvatar} 
                      alt={conv.otherUser.name}
                      className="user-avatar"
                      style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}
                      onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = defaultAvatar; 
                        }}
                   />
                </div>
                <div className="conversation-details">
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                      <span className="conversation-user-name" style={{fontWeight:600}}>{conv.otherUser.name}</span>
                      <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>
                          {formatMessageTime(conv.lastMessageDate)}
                      </span>
                  </div>
                  
                  {conv.product && (
                      <div style={{fontSize:'0.8rem', color:'var(--primary-color)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                          {conv.product.title}
                      </div>
                  )}

                  <div className="conversation-preview" style={{fontSize:'0.8rem', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                      {conv.lastMessagePreview}
                  </div>
                </div>
              </li>
            ))}
              {filteredConversations.length === 0 && (
                <li style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {activeFilter === 'All Messages' ? 'No conversations found.' : `No '${activeFilter}' conversations found.`}
                </li>
            )}
          </ul>
        </aside>

        {/* Right Chat Area */}
        <main className={`chat-area ${!selectedConversation ? 'no-chat-selected' : ''} ${isChatVisible ? 'mobile-visible' : ''}`}>
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <button className="chat-back-button" onClick={handleBackToList}>
                  <Icons.BackArrow />
                </button>
                <div className="chat-user-info">
                  <span className="user-name">{selectedConversation.otherUser.name}</span>
                </div>
                
                {/* --- ListingCard Integration --- */}
                {selectedConversation.product && (
                  <div className="chat-listing-card-wrapper" style={{ marginLeft: 'auto', marginRight: '10px' }}>
                      <ListingCard
                        listing={selectedConversation.product}
                        onClick={() => openModal(selectedConversation.product)} 
                        isLiked={likedListingIds.has(selectedConversation.product.listingId)}
                        onLikeClick={handleLikeToggle}
                        isLiking={likingInProgress.has(selectedConversation.product.listingId)}
                        currentUserId={userData?.userId}
                        variant="compact" 
                      />
                  </div>
                )}

                {/* Chat Action Menu */}
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                      <button 
                          className="icon-button" 
                          onClick={() => setIsChatMenuOpen(!isChatMenuOpen)}
                          style={{ fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px' }}
                      >
                          ⋮
                      </button>
                      
                      {isChatMenuOpen && (
                          <div className="filter-dropdown-menu" style={{ right: 0, left: 'auto', top: '100%', width: '150px', zIndex: 100 }}>
                              <button className="filter-option" onClick={handleArchiveChat}>
                                  {selectedConversation.isArchived ? 'Unarchive' : 'Archive'}
                              </button>
                              <button className="filter-option" onClick={handleDeleteChat} style={{color: 'red'}}>
                                  Delete
                              </button>
                          </div>
                      )}
                </div>
              </div>

              <div className="chat-content" ref={chatContentRef}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`message-bubble-wrapper ${msg.senderId === userData.userId ? 'sent' : 'received'}`}
                  >
                    <div className={`message-bubble ${msg.senderId === userData.userId ? 'sent' : 'received'}`}>
                      {msg.text}
                    </div>
                    <span className="message-timestamp">{msg.timestamp}</span>
                  </div>
                ))}
              </div>

              <div className="chat-input-area">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  placeholder="Type here..."
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                      }
                  }}
                  rows={1}
                />
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