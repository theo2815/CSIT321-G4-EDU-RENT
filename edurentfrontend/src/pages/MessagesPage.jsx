import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// WebSocket libraries for real-time communication
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// UI Components
import Header from '../components/Header';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductDetailModalSkeleton from '../components/ProductDetailModalSkeleton';
import ListingCard from '../components/ListingCard'; 

// Backend API interaction services
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
  archiveConversation,
  markConversationAsRead,
  markConversationAsUnread 
} from '../services/apiService';

// Styling and static assets
import '../static/MessagesPage.css';
import defaultAvatar from '../assets/default-avatar.png';

// Icon definitions for the UI
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
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
      <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
    </svg>
  )
};

// Skeleton loader displayed when switching between chats
function ChatWindowSkeleton() {
  return (
    <div className="chat-skeleton-loader">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
         <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
         <div className="skeleton" style={{ width: '150px', height: '20px', borderRadius: '4px' }}></div>
      </div>
      <div className="skeleton" style={{ width: '60%', height: '40px', borderRadius: '20px 20px 20px 0', alignSelf: 'flex-start' }}></div>
      <div className="skeleton" style={{ width: '50%', height: '40px', borderRadius: '20px 20px 0 20px', alignSelf: 'flex-end' }}></div>
      <div className="skeleton" style={{ width: '70%', height: '60px', borderRadius: '20px 20px 20px 0', alignSelf: 'flex-start' }}></div>
    </div>
  );
}

// Skeleton loader displayed for the sidebar on initial page load
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

// Helper to format raw date strings into user-friendly time format (HH:MM AM/PM)
const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessagesPage() {
  // State: User and Session Data
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  
  // State: Conversation and Message Data
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); 
  
  // State: Inputs and UI Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Messages');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // State: Menu Visibility
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false); // Menu inside the chat window
  const [activeListMenuId, setActiveListMenuId] = useState(null); // Menu on individual list items

  // State: Loading and Error handling
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); 
  const [error, setError] = useState(null);

  // State: Modals and Interactivity
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  const [isNotificationLoading, setIsNotificationLoading] = useState(false); 
  
  // State: Mobile View Toggle
  const [isChatVisible, setIsChatVisible] = useState(false);

  // Hooks and Refs
  const navigate = useNavigate();
  const location = useLocation(); 
  const chatContentRef = useRef(null); 
  const textareaRef = useRef(null); 
  
  // Refs for WebSocket management
  const stompClientRef = useRef(null);
  const conversationSubscriptionRef = useRef(null);

  // Global click listener to close dropdown menus when clicking outside
  useEffect(() => {
    const closeMenus = () => {
      setIsFilterDropdownOpen(false);
      setIsChatMenuOpen(false);
      setActiveListMenuId(null);
    };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  // Fetch initial data: User details, conversation list, and liked items
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get Current User
      const userResponse = await getCurrentUser();
      const currentUser = userResponse.data;
      if (!currentUser) throw new Error("No user data.");
      
      setUserData(currentUser);
      setUserName(currentUser.fullName.split(' ')[0]);
      const userId = currentUser.userId;

      // 2. Get Conversations
      const convResponse = await getConversationsForUser(userId);
      const convs = convResponse.data || [];

      // Transform raw conversation data into UI-friendly format
      const processedConvs = convs.map(conv => {
          if (!conv.participants) return null;

          const otherParticipant = conv.participants.find(p => {
              const pUserId = p.userId || p.user?.userId || p.user?.id; 
              return pUserId !== userId;
          });
          
          const otherUserObj = otherParticipant || otherParticipant?.user || {};

          const otherUser = { 
              userId: otherUserObj.userId || otherUserObj.id || 0, 
              fullName: otherUserObj.fullName || otherUserObj.name || 'Unknown User', 
              profilePictureUrl: otherUserObj.profilePictureUrl || otherUserObj.avatar || null 
          };
          
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
                  ownerId: conv.listing.owner?.userId || conv.listing.user?.userId, 
                  image: productImageUrl, 
                  iconUrl: productImageUrl 
              } : null,
              
              lastMessagePreview: conv.lastMessageContent || 'Start a conversation', 
              lastMessageDate: conv.lastMessageTimestamp || conv.listing?.createdAt,
              
              isUnread: false, // Default false, WebSocket/Polling will update this
              isArchived: conv.isArchivedForCurrentUser || false 
          };
      }).filter(Boolean);

      setConversations(processedConvs);
      
      // 3. Handle Deep Linking (e.g., User clicked "Contact Seller" on a product page)
      const passedConvId = location.state?.openConversationId;
      if (passedConvId) {
          const targetConv = processedConvs.find(c => c.id === passedConvId);
          if (targetConv) {
              setSelectedConversation(targetConv);
              setIsChatVisible(true);
              window.history.replaceState({}, document.title);
          }
      }

      // 4. Get Liked Listings
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

  // Trigger data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manage WebSocket Connection
  // Establishes the connection for real-time updates on conversation lists
  useEffect(() => {
    if (userData) {
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = Stomp.over(socket);
      // stompClient.debug = null; // Optional: Uncomment to disable browser console logs for sockets

      stompClient.connect({}, () => {
        stompClientRef.current = stompClient;
        
        // Subscribe to the user's personal channel
        // This listens for new messages globally to update the sidebar list (e.g., "Unread" indicators)
        stompClient.subscribe(`/topic/user.${userData.userId}`, (message) => {
          const payload = JSON.parse(message.body);
          
          setConversations(prevConvs => {
            const convIndex = prevConvs.findIndex(c => c.id === payload.conversationId);
            if (convIndex > -1) {
              // Update existing conversation and move to top
              const updatedConvs = [...prevConvs];
              const conv = updatedConvs[convIndex];
              
              updatedConvs.splice(convIndex, 1);
              
              updatedConvs.unshift({
                ...conv,
                lastMessagePreview: payload.text,
                lastMessageDate: payload.timestamp,
                isUnread: true // Mark as unread when notification received
              });
              return updatedConvs;
            } else {
              // If it's a completely new conversation, re-fetch the full list
              fetchData(); 
              return prevConvs;
            }
          });
        });

      }, (error) => {
        console.error("WebSocket error:", error);
      });

      // Cleanup: Disconnect socket when component unmounts
      return () => {
        if (stompClientRef.current) {
          stompClientRef.current.disconnect();
        }
      };
    }
  }, [userData, fetchData]);

  // Filter Logic
  // Filters the conversation list based on the active tab (Selling, Buying, Unread, etc.)
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

  // Auto-scroll Logic
  // Automatically scrolls the chat window to the bottom when new messages arrive
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Handlers ---

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle clicking a conversation from the sidebar
  // 1. Sets UI state
  // 2. Subscribes to WebSocket for THIS specific chat
  // 3. Fetches existing history
  const handleSelectConversation = async (conversation) => {
    if (activeListMenuId) return; 

    setIsMessagesLoading(true);
    setSelectedConversation(conversation);
    setIsChatVisible(true); 
    setMessages([]); 
    setIsChatMenuOpen(false);

    // Mark as read locally
    setConversations(prev => prev.map(c => 
      c.id === conversation.id ? { ...c, isUnread: false } : c
    ));

    // --- Socket Subscription ---
    if (stompClientRef.current && stompClientRef.current.connected) {
        if (conversationSubscriptionRef.current) {
            conversationSubscriptionRef.current.unsubscribe();
        }
        
        conversationSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/conversation.${conversation.id}`, (message) => {
            const payload = JSON.parse(message.body);
            
            // FIX 1: Ignore my own messages from socket (we handle them optimistically in handleSendMessage)
            if (payload.senderId === userData.userId) return;

            const newMsg = {
                id: payload.id,
                senderId: payload.senderId,
                text: payload.text,
                timestamp: formatMessageTime(payload.timestamp)
            };
            setMessages(prev => [...prev, newMsg]);
            
            // Mark read immediately if chat is open
            markConversationAsRead(conversation.id);
        });
    }

    try {
      const [messagesRes, _] = await Promise.all([
          getMessages(conversation.id),
          markConversationAsRead(conversation.id)
      ]);

      const mappedMessages = messagesRes.data.map(msg => ({
          id: msg.messageId,
          senderId: msg.sender?.userId,
          text: msg.content,
          timestamp: formatMessageTime(msg.sentAt)
      }));
      setMessages(mappedMessages);

    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  // --- 3-Dot Menu Action Handlers (Sidebar) ---
  
  const handleListMenuToggle = (e, convId) => {
    e.stopPropagation();
    setActiveListMenuId(prev => prev === convId ? null : convId);
  };

  const handleArchiveListAction = async (e, conv) => {
    e.stopPropagation();
    setActiveListMenuId(null);
    // Optimistic UI Update
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, isArchived: !c.isArchived } : c
    ));
    try { await archiveConversation(conv.id); } catch (err) { console.error("Archive failed", err); fetchData(); }
  };

  const handleDeleteListAction = async (e, convId) => {
    e.stopPropagation();
    setActiveListMenuId(null);
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    
    // Optimistic UI Update
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
      setIsChatVisible(false);
    }
    try { await deleteConversation(convId); } catch (err) { console.error("Delete failed", err); fetchData(); }
  };

  const handleReadUnreadAction = async (e, conv) => {
    e.stopPropagation();
    setActiveListMenuId(null);
    const newStatus = !conv.isUnread; 
    // Optimistic UI Update
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, isUnread: newStatus } : c
    ));
    try {
      if (newStatus) await markConversationAsUnread(conv.id);
      else await markConversationAsRead(conv.id);
    } catch (err) { console.error("Toggle failed", err); fetchData(); }
  };

  // --- Chat Input Handlers ---
  
  const handleBackToList = () => {
    setIsChatVisible(false);
    // Clean up subscription when leaving the chat view
    if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe();
        conversationSubscriptionRef.current = null;
    }
    setSelectedConversation(null);
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    // Auto-resize textarea
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

      const tempTimestamp = new Date();
      const formattedTime = formatMessageTime(tempTimestamp);

      // FIX 2: Optimistic Update - Add message to Chat Window immediately
      const optimisticMsg = {
          id: Date.now(), // Temp ID
          senderId: userData.userId,
          text: textToSend,
          timestamp: formattedTime
      };
      setMessages(prev => [...prev, optimisticMsg]);

      // FIX 3: Optimistic Update - Update Sidebar List immediately
      setConversations(prevConvs => {
          const updatedConvs = [...prevConvs];
          const index = updatedConvs.findIndex(c => c.id === selectedConversation.id);
          if (index > -1) {
              const conv = updatedConvs[index];
              updatedConvs.splice(index, 1); // Remove
              updatedConvs.unshift({         // Add to top
                  ...conv,
                  lastMessagePreview: textToSend,
                  lastMessageDate: tempTimestamp.toISOString(),
                  isUnread: false
              });
          }
          return updatedConvs;
      });

      try {
          await sendMessage(textToSend, selectedConversation.id, userData.userId);
      } catch (error) { 
          console.error("Failed to send message", error); 
          alert("Failed to send message. Please try again.");
          // Optional: Remove optimistic message on failure here
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('eduRentUserData');
    navigate('/login');
  };

  // --- Modal & Notification Handlers ---

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

  const handleArchiveChat = async () => {
      if (!selectedConversation) return;
      const convId = selectedConversation.id;
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, isArchived: !c.isArchived } : c));
      setSelectedConversation(null); 
      setIsChatMenuOpen(false);
      setIsChatVisible(false); 
      try { await archiveConversation(convId); } catch (err) { console.error("Failed to archive:", err); fetchData(); }
  };

  const handleDeleteChat = async () => {
      if (!selectedConversation) return;
      if (!window.confirm("Are you sure?")) return;
      const convId = selectedConversation.id;
      setConversations(prev => prev.filter(c => c.id !== convId));
      setSelectedConversation(null);
      setIsChatMenuOpen(false);
      setIsChatVisible(false);
      try { await deleteConversation(convId); } catch (err) { console.error("Failed to delete:", err); fetchData(); }
  };

  const openModal = async (listingSummary) => {
    const listingId = listingSummary.id || listingSummary.listingId;
    if (!listingId) return;
    setIsNotificationLoading(true);
    try {
      const response = await getListingById(listingId);
      if (response.data) {
        setSelectedListing(response.data);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load details:", err);
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
      return <div className="profile-page"><Header userName="" onLogout={handleLogout} /><MessagesSkeleton /></div>;
  }
  if (error) {
      return <div className="profile-page"><Header userName={userName} onLogout={handleLogout} /><div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div></div>;
  }

  const filterOptions = ['All Messages', 'Selling', 'Buying', 'Unread', 'Archived'];

  return (
    <div className="profile-page">
      <div style={{ position: 'relative', zIndex: (isModalOpen || isNotificationLoading) ? 1 : 2000 }}>
        <Header userName={userName} 
          profilePictureUrl={userData?.profilePictureUrl}
          onLogout={handleLogout} 
          onNotificationClick={handleNotificationClick}
        />
      </div>

      <div className="messages-page-container">
        {/* Left Sidebar */}
        <aside className={`conversations-sidebar ${isChatVisible ? 'mobile-hidden' : ''}`}>
          <div className="conversations-header">
            <div className="message-filter-container">
                <button 
                    className="message-filter-btn" 
                    onClick={(e) => { e.stopPropagation(); setIsFilterDropdownOpen(!isFilterDropdownOpen); }}
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
          {filteredConversations.map((conv) => (
          <li
            key={conv.id}
            className={`conversation-list-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.isUnread ? 'unread' : ''} ${activeListMenuId === conv.id ? 'menu-active' : ''}`}
            onClick={() => handleSelectConversation(conv)}

            // Z-Index logic to prevent menu from being covered by the item below
            style={{ 
                zIndex: activeListMenuId === conv.id ? 1000 : 1, 
                position: 'relative' 
            }}
            role="button"
            tabIndex={0}
          >
              <div className="conversation-avatar">
                  <img 
                    src={conv.otherUser.avatar ? `http://localhost:8080${conv.otherUser.avatar}` : defaultAvatar} 
                    alt={conv.otherUser.name}
                    className="user-avatar"
                    style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  />
              </div>

              {/* Content Area */}
              <div style={{ flex: 1, minWidth: 0, marginRight: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="conversation-user-name" style={{ marginBottom: '0.25rem' }}>
                    {conv.otherUser.name}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                      {conv.product && (
                          <span style={{ color: 'var(--primary-color)', fontWeight: 500, marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
                              {conv.product.title}:
                          </span>
                      )}
                      <span className="conversation-preview" style={{ color: conv.isUnread ? 'var(--text-color)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.lastMessagePreview}
                      </span>
                  </div>
              </div>

              {/* Actions Area (Right Side) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatMessageTime(conv.lastMessageDate)}
                      </span>
                      
                      {/* Relative container for the menu to anchor to */}
                      <div style={{ position: 'relative' }}>
                          <button 
                            className="icon-button" 
                            onClick={(e) => handleListMenuToggle(e, conv.id)}
                            style={{ padding: '2px', fontSize: '1rem', height: '24px', width: '24px' }}
                          >
                            <Icons.MenuDots />
                          </button>

                          {/* Dropdown Menu */}
                          {activeListMenuId === conv.id && (
                            <div 
                                className="filter-dropdown-menu" 
                                // Dropdown positioning fix: left: 'auto'
                                style={{ right: '0', left: 'auto', top: '100%', width: '150px', zIndex: 50 }}
                            >
                                <button className="filter-option" onClick={(e) => handleReadUnreadAction(e, conv)}>
                                  {conv.isUnread ? 'Mark as Read' : 'Mark as Unread'}
                                </button>
                                <button className="filter-option" onClick={(e) => handleArchiveListAction(e, conv)}>
                                  {conv.isArchived ? 'Unarchive' : 'Archive'}
                                </button>
                                <button className="filter-option" onClick={(e) => handleDeleteListAction(e, conv.id)} style={{ color: 'red' }}>
                                  Delete
                                </button>
                            </div>
                          )}
                      </div>
                  </div>
                  
                  {/* Unread Dot */}
                  {conv.isUnread && <span className="unread-dot" title="Unread messages"></span>}
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
          
          {isMessagesLoading ? (
             <ChatWindowSkeleton />
          ) : selectedConversation ? (
            <>
              <div className="chat-header">
                <button className="chat-back-button" onClick={handleBackToList}>
                  <Icons.BackArrow />
                </button>
                <div className="chat-user-info">
                  <span className="user-name">{selectedConversation.otherUser.name}</span>
                </div>
                
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

                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                      <button 
                          className="icon-button" 
                          onClick={(e) => {
                              e.stopPropagation(); // Prevents menu from closing immediately
                              setIsChatMenuOpen(!isChatMenuOpen);
                          }}
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
              <button onClick={handleBackToList} className="empty-state-back-btn">
                  ← Back to Messages
              </button>
              <span className="no-conversation-icon">💬</span>
              <h2>Select a conversation</h2>
              <p>Choose a chat from the left to start messaging.</p>
            </div>
          )}
        </main>
      </div>
      
      {isModalOpen && selectedListing && (
        <div style={{ position: 'relative', zIndex: 3000 }}>
            <ProductDetailModal
              listing={selectedListing}
              onClose={closeModal}
              currentUserId={userData?.userId}
              isLiked={likedListingIds.has(selectedListing.listingId)}
              onLikeClick={handleLikeToggle}
              isLiking={likingInProgress.has(selectedListing.listingId)}
            />
        </div>
      )}
      {isNotificationLoading && (
        <ProductDetailModalSkeleton onClose={() => setIsNotificationLoading(false)} />
      )}
    </div>
  );
}