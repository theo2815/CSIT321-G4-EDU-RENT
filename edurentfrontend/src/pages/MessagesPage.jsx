import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Libraries for real-time chat functionality
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

// Custom hooks to manage complex logic outside the view
import usePageLogic from '../hooks/usePageLogic';
import useChatScroll from '../hooks/useChatScroll';
import useAuth from '../hooks/useAuth';

// New Feedback Hooks
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmationContext';

// UI Components
import Header from '../components/Header';
import ListingCard from '../components/ListingCard'; 
import ReviewModal from '../components/ReviewModal'; 
import UserRatingDisplay from '../components/UserRatingDisplay';
import AlertBanner from '../components/AlertBanner'; 

// API functions
import { 
  getCurrentUser, 
  getMessages,                
  sendMessage,                
  getConversationsForUser,
  startConversation,
  getLikedListings,
  likeListing,     
  unlikeListing,
  deleteConversation, 
  archiveConversation,
  markConversationAsRead,
  markConversationAsUnread,
  uploadMessageImage,
  getUserReviews 
} from '../services/apiService';

// Styles
import '../static/MessagesPage.css';
import defaultAvatar from '../assets/default-avatar.png';

// --- Icons Component ---
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

// --- Skeletons ---
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

// --- Formatters ---
const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
  
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
};
  
const formatChatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const timeOptions = { hour: 'numeric', minute: '2-digit' };
  
    if (isToday) return date.toLocaleTimeString([], timeOptions);
    const diffInHours = (now - date) / 1000 / 60 / 60;
    if (diffInHours < 24 * 6) return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], timeOptions);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + date.toLocaleTimeString([], timeOptions);
};

export default function MessagesPage() {
  // Access our new feedback tools
  const toast = useToast();
  const confirm = useConfirm();

  // Store user details and the list of active conversations
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  const [conversations, setConversations] = useState([]);
  
  // Track the currently open chat and its messages
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]); 
  
  // UI controls for filtering and searching
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Messages');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [listingFilterId, setListingFilterId] = useState(null); 
  
  const location = useLocation(); 
  const navigate = useNavigate();
  const { retryAuth, logout } = useAuth();

  // Visibility toggles for mobile views and menus
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [activeListMenuId, setActiveListMenuId] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Loading and Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // New: Track socket connection state

  // References
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const stompClientRef = useRef(null);
  const conversationSubscriptionRef = useRef(null);
  const selectedConversationRef = useRef(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Scroll management
  const { 
    chatContentRef, 
    showScrollBtn, 
    scrollToBottom, 
    handleScroll: onScrollInternal 
  } = useChatScroll(messages);

  const handleScroll = (e) => {
      onScrollInternal(e);
      handleInfiniteScroll(e);
  };
  
  const [chatUserRating, setChatUserRating] = useState(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // --- Likes Handling ---
  const [likedListingIds, setLikedListingIds] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());

  const handleLikeToggle = async (listingId) => {
    if (likingInProgress.has(listingId)) return;
    setLikingInProgress(prev => new Set(prev).add(listingId));
    
    // Optimistic UI update
    const newLikedIds = new Set(likedListingIds);
    const isCurrentlyLiked = likedListingIds.has(listingId);
    if (isCurrentlyLiked) newLikedIds.delete(listingId); 
    else newLikedIds.add(listingId);
    setLikedListingIds(newLikedIds);

    try { 
      if (isCurrentlyLiked) await unlikeListing(listingId); 
      else await likeListing(listingId); 
    } catch (err) {
      // Revert if failed
      setLikedListingIds(prevIds => {
          const revertedIds = new Set(prevIds);
          if (isCurrentlyLiked) revertedIds.add(listingId); 
          else revertedIds.delete(listingId);
          return revertedIds;
      });
      toast.showError("Failed to update like status.");
    } finally {
      setLikingInProgress(prev => { const next = new Set(prev); next.delete(listingId); return next; });
    }
  };

  const likesHook = { likedListingIds, likingInProgress, handleLikeToggle };
  const { openModal, handleNotificationClick, ModalComponent } = usePageLogic(userData, likesHook);

  const getDateLabel = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const y = new Date(n);
    y.setDate(n.getDate() - 1);
    if (d.getTime() === n.getTime()) return 'Today';
    if (d.getTime() === y.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Effects & Data Fetching ---

  useEffect(() => {
      if (location.state?.filterByListingId) {
          const targetId = location.state.filterByListingId;
          setListingFilterId(targetId);
          setSearchQuery('');
          setActiveFilter('All Messages'); 
      }
  }, [location.state]);

  const clearListingFilter = () => {
      setListingFilterId(null);
      navigate(location.pathname, { replace: true, state: {} });
  };

  const filteredConversations = useMemo(() => {
    if (!userData) return [];
    let result = conversations;

    if (listingFilterId) {
        result = result.filter(c => c.product && c.product.id === listingFilterId);
    } else {
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
    }

    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        result = result.filter(conv =>
          conv.otherUser.name.toLowerCase().includes(query) ||
          (conv.product && conv.product.title.toLowerCase().includes(query))
        );
    }
    return result;
  }, [activeFilter, searchQuery, conversations, userData, listingFilterId]);

  // Upload an image attachment
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConversation) return;
    try {
      const response = await uploadMessageImage(selectedConversation.id, file);
      const imageUrl = response.data.url;

      const tempTimestamp = new Date();
      const optimisticMsg = {
          id: Date.now(),
          senderId: userData.userId,
          text: '',
          attachmentUrl: imageUrl,
          timestamp: formatChatTimestamp(tempTimestamp),
          rawDate: tempTimestamp.toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);

      await sendMessage('', selectedConversation.id, userData.userId, imageUrl);
    } catch (error) {
      console.error("Failed to send image", error);
      toast.showError("Failed to upload image. Please try again.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch User Data
      const userResponse = await getCurrentUser();
      const currentUser = userResponse.data;
      if (!currentUser) throw new Error("No user data.");
      
      setUserData(currentUser);
      setUserName(currentUser.fullName.split(' ')[0]);
      const userId = currentUser.userId;

      // 2. Fetch User Conversations
      const convResponse = await getConversationsForUser(userId);
      const convs = convResponse.data || [];

      // Process conversation data
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
              profilePictureUrl: otherUserObj.profilePictureUrl || otherUserObj.avatar || null,
              school: otherUserObj.schoolName || 'N/A'
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
                  avatar: otherUser.profilePictureUrl,
                  school: otherUser.school
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
              isUnread: conv.isUnread || false,
              isArchived: conv.isArchivedForCurrentUser || false,
              transactionId: conv.transactionId || null,
              hasReviewed: conv.hasReviewed || false 
          };
      }).filter(Boolean);

      processedConvs.sort((a, b) => {
          const dateA = new Date(a.lastMessageDate || 0);
          const dateB = new Date(b.lastMessageDate || 0);
          return dateB - dateA;
      });

      setConversations(processedConvs);
      
      // 3. Handle External Navigation
      const passedConv = location.state?.openConversation;
      const passedConvId = location.state?.openConversationId;
      const initiateChat = location.state?.initiateChat;

      if (passedConvId) {
          let targetConv = processedConvs.find(c => c.id === passedConvId);
          if (!targetConv && passedConv) {
              // Create temporary conv object
              const participants = passedConv.participants || [];
              const otherParticipantObj = participants.find(p => {
                  const pId = p.user?.userId || p.userId; 
                  return pId !== userId;
              })?.user || {};

              targetConv = {
                  id: passedConv.conversationId,
                  otherUser: {
                      id: otherParticipantObj.userId,
                      name: otherParticipantObj.fullName || 'User',
                      avatar: otherParticipantObj.profilePictureUrl
                  },
                  product: passedConv.listing ? {
                      id: passedConv.listing.listingId,
                      title: passedConv.listing.title,
                      price: passedConv.listing.price,
                      ownerId: passedConv.listing.user?.userId,
                      image: passedConv.listing.images?.[0]?.imageUrl,
                      iconUrl: passedConv.listing.images?.[0]?.imageUrl
                  } : null,
                  lastMessagePreview: 'Start a conversation',
                  lastMessageDate: new Date().toISOString(),
                  isUnread: false
              };
              setConversations(prev => [targetConv, ...prev]);
          }
          if (targetConv) {
              handleSelectConversation(targetConv);
              setIsChatVisible(true);
              window.history.replaceState({}, document.title);
          }
      } else if (initiateChat && currentUser) {
          let targetConv = processedConvs.find(c => 
              c.product?.id === initiateChat.listingId && 
              c.otherUser?.id === initiateChat.sellerId
          );

          if (targetConv) {
              handleSelectConversation(targetConv);
              setIsChatVisible(true);
          } else {
              try {
                  const newConvRes = await startConversation(
                      initiateChat.listingId, 
                      currentUser.userId, 
                      initiateChat.sellerId
                  );
                  
                  const raw = newConvRes.data;
                  const img = raw.listing?.images?.[0]?.imageUrl || raw.listing?.imageUrl || null;
                  
                  const newUiConv = {
                      id: raw.conversationId,
                      otherUser: {
                          id: initiateChat.sellerId,
                          name: raw.participants?.find(p => p.user.userId !== currentUser.userId)?.user.fullName || 'User',
                          avatar: raw.participants?.find(p => p.user.userId !== currentUser.userId)?.user.profilePictureUrl
                      },
                      product: {
                          id: raw.listing.listingId,
                          title: raw.listing.title,
                          price: raw.listing.price,
                          ownerId: raw.listing.user?.userId,
                          image: img,
                          iconUrl: img
                      },
                      lastMessagePreview: 'Start a conversation',
                      lastMessageDate: new Date().toISOString(),
                      isUnread: false
                  };

                  setConversations(prev => [newUiConv, ...prev]);
                  handleSelectConversation(newUiConv);
                  setIsChatVisible(true);
              } catch (err) {
                  console.error("Failed to auto-create conversation", err);
                  toast.showError("Could not initialize new chat.");
              }
          }
          window.history.replaceState({}, document.title);
      }

      // 4. Fetch Liked Listings
      const likesResponse = await getLikedListings();
      const likedIds = new Set(likesResponse.data.map(listing => listing.listingId));
      setLikedListingIds(likedIds);

    } catch (err) {
      console.error("Failed to fetch messages data:", err);
      // Don't toast here if we are showing the full page error, or do both.
      setError("Could not load messages.");
      if (err.message === "No authentication token found." || err.response?.status === 401) {
          navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.state]);

  // Initial Fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // --- WEBSOCKET CONNECTION (Global) ---
  // This effect runs ONCE when userData is available to establish the socket connection.
  useEffect(() => {
    if (userData) {
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = Stomp.over(socket);

      stompClient.connect({}, () => {
        stompClientRef.current = stompClient;
        setIsConnected(true);

        // Subscribe to sidebar updates (Global user topic)
        stompClient.subscribe(`/topic/user.${userData.userId}`, (message) => {
          const payload = JSON.parse(message.body);
          setConversations(prevConvs => {
            const convIndex = prevConvs.findIndex(c => c.id === payload.conversationId);
            if (convIndex > -1) {
              const updatedConvs = [...prevConvs];
              const conv = updatedConvs[convIndex];
              updatedConvs.splice(convIndex, 1);
              updatedConvs.unshift({
                ...conv,
                lastMessagePreview: payload.text,
                lastMessageDate: payload.timestamp,
                // Only mark as unread if we aren't currently looking at this chat
                isUnread: selectedConversation?.id === payload.conversationId ? false : true 
              });
              return updatedConvs;
            } else {
              fetchData(); 
              return prevConvs;
            }
          });
          
          const currentChatId = selectedConversationRef.current?.id;
          
          if (!currentChatId || currentChatId !== payload.conversationId) {
             toast.showInfo(`New message from ${payload.senderName || 'someone'}`);
          }
        });
      }, (err) => {
        console.error("Socket connection error:", err);
        setIsConnected(false);
      });

      return () => { 
        if (stompClientRef.current) stompClientRef.current.disconnect(); 
        setIsConnected(false);
      };
    }
  }, [userData]); // Dependencies removed to keep connection stable

  // --- WEBSOCKET SUBSCRIPTION (Active Chat) ---
  // This effect handles subscribing/unsubscribing to the specific conversation topic
  // whenever the user clicks a different conversation.
  useEffect(() => {
    if (!selectedConversation || !isConnected || !stompClientRef.current) return;

    // Unsubscribe from previous chat
    if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe();
    }

    // Subscribe to new chat
    conversationSubscriptionRef.current = stompClientRef.current.subscribe(`/topic/conversation.${selectedConversation.id}`, (message) => {
        const payload = JSON.parse(message.body);
        
        // Prevent duplicate messages if sender is self (handled optimistically)
        if (payload.senderId === userData.userId) return;

        const newMsg = {
            id: payload.id, 
            senderId: payload.senderId, 
            text: payload.text,
            attachmentUrl: payload.attachmentUrl, 
            timestamp: formatChatTimestamp(payload.timestamp), 
            rawDate: payload.timestamp
        };

        setMessages(prev => {
            // Safety check for duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });
        
        markConversationAsRead(selectedConversation.id);
    });

    return () => {
        if (conversationSubscriptionRef.current) {
            conversationSubscriptionRef.current.unsubscribe();
        }
    };
  }, [selectedConversation, isConnected, userData]);


  // Load the message history when the user clicks on a conversation
  const handleSelectConversation = async (conversation) => {
    if (activeListMenuId) return; 
    setIsMessagesLoading(true);
    setSelectedConversation(conversation);
    setIsChatVisible(true); 
    setMessages([]); 
    setPage(0);       
    setHasMore(true);
    setIsChatMenuOpen(false);
    setChatUserRating(null);

    // Mark locally as read
    setConversations(prev => prev.map(c => 
      c.id === conversation.id ? { ...c, isUnread: false } : c
    ));

    // Note: The WebSocket subscription is now handled by the separate useEffect above,
    // so we don't need to manually subscribe here anymore.

    try {
      const [messagesRes, ratingRes] = await Promise.all([
          getMessages(conversation.id, 0),
          getUserReviews(conversation.otherUser.id),
          markConversationAsRead(conversation.id)
      ]);

      const mappedMessages = messagesRes.data.map(msg => ({
          id: msg.messageId, senderId: msg.sender?.userId, text: msg.content,
          attachmentUrl: msg.attachmentUrl, timestamp: formatChatTimestamp(msg.sentAt), rawDate: msg.sentAt
      }));
      setMessages(mappedMessages);
      if (messagesRes.data.length < 20) setHasMore(false);

      const reviews = ratingRes.data || [];
      const count = reviews.length;
      const avg = count > 0 
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
        : 0;
      setChatUserRating({ avg, count });

    } catch (err) {
      console.error("Error loading conversation:", err);
      toast.showError("Failed to load conversation history.");
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // --- Sidebar Actions (Delete, Archive, Mark Read) ---
  const handleListMenuToggle = (e, convId) => { e.stopPropagation(); setActiveListMenuId(prev => prev === convId ? null : convId); };
  
  const handleArchiveListAction = async (e, conv) => {
    e.stopPropagation(); setActiveListMenuId(null);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, isArchived: !c.isArchived } : c));
    try { 
        await archiveConversation(conv.id); 
        toast.showSuccess(conv.isArchived ? "Conversation unarchived" : "Conversation archived");
    } catch (err) { 
        console.error("Archive failed", err); 
        fetchData(); // Revert on failure
        toast.showError("Action failed. Reloading...");
    }
  };

  const handleDeleteListAction = async (e, convId) => {
    e.stopPropagation(); setActiveListMenuId(null);
    
    // We use the new Confirm Provider here
    const isConfirmed = await confirm({
        title: "Delete Conversation?",
        message: "This cannot be undone. The chat history will be removed for you.",
        confirmText: "Delete",
        isDangerous: true
    });

    if (!isConfirmed) return;

    setConversations(prev => prev.filter(c => c.id !== convId));
    if (selectedConversation?.id === convId) { setSelectedConversation(null); setIsChatVisible(false); }
    try { 
        await deleteConversation(convId); 
        toast.showSuccess("Conversation deleted");
    } catch (err) { 
        console.error("Delete failed", err); 
        fetchData(); 
        toast.showError("Failed to delete conversation");
    }
  };

  const handleReadUnreadAction = async (e, conv) => {
    e.stopPropagation(); setActiveListMenuId(null);
    const newStatus = !conv.isUnread; 
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, isUnread: newStatus } : c));
    try { 
        if (newStatus) await markConversationAsUnread(conv.id); 
        else await markConversationAsRead(conv.id); 
    } catch (err) { 
        console.error("Toggle failed", err); 
        fetchData(); 
    }
  };

  // --- Chat Actions ---
  const handleBackToList = () => {
    setIsChatVisible(false);
    if (conversationSubscriptionRef.current) { conversationSubscriptionRef.current.unsubscribe(); conversationSubscriptionRef.current = null; }
    setSelectedConversation(null);
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; }
  };

  const handleSendMessage = async () => {
      if (!newMessage.trim() || !selectedConversation || !userData) return;
      const textToSend = newMessage;
      setNewMessage(''); 
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      const tempTimestamp = new Date();
      
      const optimisticMsg = {
          id: Date.now(), senderId: userData.userId, text: textToSend,
          timestamp: formatChatTimestamp(tempTimestamp), rawDate: tempTimestamp.toISOString()
      };
      setMessages(prev => [...prev, optimisticMsg]);
      
      setConversations(prevConvs => {
          const updatedConvs = [...prevConvs];
          const index = updatedConvs.findIndex(c => c.id === selectedConversation.id);
          if (index > -1) {
              const conv = updatedConvs[index];
              updatedConvs.splice(index, 1); 
              updatedConvs.unshift({ ...conv, lastMessagePreview: textToSend, lastMessageDate: tempTimestamp.toISOString(), isUnread: false });
          }
          return updatedConvs;
      });

      try { 
          await sendMessage(textToSend, selectedConversation.id, userData.userId); 
      } catch (error) { 
          console.error("Failed to send", error); 
          toast.showError("Message failed to send.");
      }
  };

  const handleInfiniteScroll = async (e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      const prevHeight = e.currentTarget.scrollHeight; 
      const nextPage = page + 1;
      try {
        const response = await getMessages(selectedConversation.id, nextPage);
        const newRawMessages = response.data;
        if (newRawMessages.length > 0) {
          const mappedNewMessages = newRawMessages.map(msg => ({
            id: msg.messageId, senderId: msg.sender?.userId, text: msg.content,
            attachmentUrl: msg.attachmentUrl, timestamp: formatChatTimestamp(msg.sentAt), rawDate: msg.sentAt
          }));
          setMessages(prev => [...mappedNewMessages, ...prev]);
          setPage(nextPage);
          requestAnimationFrame(() => { if (chatContentRef.current) chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight - prevHeight; });
          if (newRawMessages.length < 20) setHasMore(false);
        } else { setHasMore(false); }
      } catch (err) { console.error("Failed load older messages", err); } finally { setIsFetchingMore(false); }
    }
  };

  const handleArchiveChat = async () => {
      if (!selectedConversation) return;
      const convId = selectedConversation.id;
      const willArchive = !selectedConversation.isArchived;

      setConversations(prev => prev.map(c => c.id === convId ? { ...c, isArchived: willArchive } : c));
      setSelectedConversation(null); setIsChatMenuOpen(false); setIsChatVisible(false); 
      
      try { 
          await archiveConversation(convId); 
          toast.showSuccess(willArchive ? "Conversation archived" : "Conversation unarchived");
      } catch (err) { 
          fetchData(); 
          toast.showError("Failed to update archive status");
      }
  };

  const handleDeleteChat = async () => {
      if (!selectedConversation) return;

      // New Confirm Logic for active chat
      const isConfirmed = await confirm({
          title: "Delete this conversation?",
          message: "You will lose all message history. This cannot be undone.",
          confirmText: "Delete Forever",
          isDangerous: true
      });

      if (!isConfirmed) return;

      const convId = selectedConversation.id;
      setConversations(prev => prev.filter(c => c.id !== convId));
      setSelectedConversation(null); setIsChatMenuOpen(false); setIsChatVisible(false);
      
      try { 
          await deleteConversation(convId); 
          toast.showSuccess("Conversation deleted");
      } catch (err) { 
          fetchData(); 
          toast.showError("Failed to delete");
      }
  };

  const handleReviewSuccess = () => {
      setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id ? { ...c, hasReviewed: true } : c
      ));
      if (selectedConversation) {
          setSelectedConversation(prev => ({ ...prev, hasReviewed: true }));
      }
      toast.showSuccess("Review submitted successfully!");
  };

  if (isLoading) {
      return <div className="profile-page"><Header userName="" onLogout={logout} /><MessagesSkeleton /></div>;
  }
  
  if (error) {
      // Replaced the raw error div with your new AlertBanner for consistency
      return (
        <div className="profile-page">
            <Header userName={userName} onLogout={logout} />
            <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                <AlertBanner type="error" message={`We couldn't load your messages. ${error}`} />
                <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: '1rem' }}>Retry</button>
            </div>
        </div>
      );
  }

  const filterOptions = ['All Messages', 'Selling', 'Buying', 'Unread', 'Archived'];

  return (
    <div className="profile-page">
      {/* Header */}
        <Header userName={userName} 
          profilePictureUrl={userData?.profilePictureUrl}
          onLogout={logout} 
          onNotificationClick={handleNotificationClick} 
        />

      <div className="messages-page-container">
        
        {/* Sidebar: Conversation List */}
        <aside className={`conversations-sidebar ${isChatVisible ? 'mobile-hidden' : ''}`}>
          <div className="conversations-header">
            
            {listingFilterId ? (
                <div className="active-filter-banner">
                    <span>Filtering by Item</span>
                    <button onClick={clearListingFilter} className="clear-filter-btn">✕ Clear</button>
                </div>
            ) : (
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
            )}

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
            style={{ zIndex: activeListMenuId === conv.id ? 1000 : 1, position: 'relative' }}
          >
              <div className="conversation-avatar">
                  <img 
                    src={
                      conv.otherUser.avatar 
                        ? (conv.otherUser.avatar.startsWith('http') ? conv.otherUser.avatar : `http://localhost:8080${conv.otherUser.avatar}`)
                        : defaultAvatar
                    }
                    alt={conv.otherUser.name}
                    className="user-avatar"
                    style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                  />
              </div>

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

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatRelativeTime(conv.lastMessageDate)}
                      </span>
                      
                      <div style={{ position: 'relative' }}>
                          <button 
                            className="icon-button" 
                            onClick={(e) => handleListMenuToggle(e, conv.id)}
                            style={{ padding: '2px', fontSize: '1rem', height: '24px', width: '24px' }}
                          >
                            <Icons.MenuDots />
                          </button>

                          {activeListMenuId === conv.id && (
                            <div className="filter-dropdown-menu" style={{ right: '0', left: 'auto', top: '100%', width: '150px', zIndex: 50 }}>
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
                  {conv.isUnread && <span className="unread-dot"></span>}
              </div>
            </li>
          ))}
            {filteredConversations.length === 0 && (
                <li style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {listingFilterId 
                        ? 'No conversation history found for this item.' 
                        : (activeFilter === 'All Messages' ? 'No conversations found.' : `No '${activeFilter}' conversations found.`)
                    }
                </li>
            )}
          </ul>
        </aside>

        {/* --- Right Chat Area --- */}
        <main className={`chat-area ${!selectedConversation ? 'no-chat-selected' : ''} ${isChatVisible ? 'mobile-visible' : ''}`}>
          
          {isMessagesLoading ? (
             <ChatWindowSkeleton />
          ) : selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <button className="chat-back-button" onClick={handleBackToList}>
                  <Icons.BackArrow />
                </button>
                <div className="chat-user-info" style={{ flexDirection: 'column', justifyContent: 'center' }}>
                <Link 
                  to={`/profile/${selectedConversation.otherUser.id}`} 
                  className="user-name" 
                  style={{ textDecoration: 'none', color: 'var(--primary-color)', cursor: 'pointer', lineHeight: '1.2' }}
                >
                  {selectedConversation.otherUser.name}
                </Link>

                <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  {selectedConversation.otherUser.school}
                </span>

                <UserRatingDisplay 
                    userId={selectedConversation.otherUser.id} 
                    initialData={chatUserRating}
                />
              </div>
                
                {/* Embedded Product Card */}
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

                {/* Review Action Buttons */}
                {selectedConversation.transactionId && !selectedConversation.hasReviewed && (
                    <button 
                        className="btn btn-primary-accent btn-small"
                        style={{ marginRight: '10px', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        onClick={() => setIsReviewModalOpen(true)}
                    >
                        Write Review
                    </button>
                )}
                {selectedConversation.transactionId && selectedConversation.hasReviewed && (
                    <span style={{ marginRight: '10px', fontSize: '0.8rem', color: '#2ecc71', fontWeight: 'bold' }}>
                        ✓ Reviewed
                    </span>
                )}

                {/* Top Right Chat Actions */}
                <div style={{ marginLeft: '0', position: 'relative' }}>
                      <button 
                          className="icon-button" 
                          onClick={(e) => { e.stopPropagation(); setIsChatMenuOpen(!isChatMenuOpen); }}
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

              {/* Chat History */}
              <div className="chat-content" ref={chatContentRef} onScroll={handleScroll}>
                {isFetchingMore && <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: '#888' }}>Loading history...</div>}
                
                {messages.map((msg, index) => {
                  const prevMsg = messages[index - 1];
                  const currentDateLabel = getDateLabel(msg.rawDate);
                  const prevDateLabel = prevMsg ? getDateLabel(prevMsg.rawDate) : null;
                  const showDateHeader = currentDateLabel !== prevDateLabel;

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateHeader && <div className="date-header-badge">{currentDateLabel}</div>}

                      <div className={`message-bubble-wrapper ${msg.senderId === userData.userId ? 'sent' : 'received'}`}>
                        <div className={`message-bubble ${msg.senderId === userData.userId ? 'sent' : 'received'}`}>
                          {msg.attachmentUrl && (
                              <img 
                                  src={msg.attachmentUrl} 
                                  alt="Attachment" 
                                  className="message-attachment"
                                  onClick={() => window.open(msg.attachmentUrl, '_blank')}
                              />
                          )}
                          {msg.text && <div>{msg.text}</div>}
                        </div>
                        <span className="message-timestamp">
                            {formatChatTimestamp(msg.rawDate)}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {showScrollBtn && (
                  <button className="scroll-bottom-btn" onClick={scrollToBottom}>
                      ⬇ New Message
                  </button>
              )}

              {/* Chat Input Area */}
              <div className="chat-input-area">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={handleFileSelect} 
                />
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  placeholder="Type here..."
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  rows={1}
                />
                {newMessage.trim() ? (
                  <button className="icon-button send-button" onClick={handleSendMessage} aria-label="Send message">
                    <Icons.Send />
                  </button>
                ) : (
                  <button className="icon-button" aria-label="Attach file" onClick={() => fileInputRef.current?.click()}>
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
      
      {/* Shared Modals */}
      <ModalComponent />

      {/* Review Modal */}
      {isReviewModalOpen && selectedConversation && (
        <div style={{ position: 'relative', zIndex: 3000 }}>
          <ReviewModal 
              transactionId={selectedConversation.transactionId}
              reviewerId={userData.userId}
              otherUserName={selectedConversation.otherUser.name}
              onClose={() => setIsReviewModalOpen(false)}
              onSuccess={handleReviewSuccess}
          />
        </div>
      )}

    </div>
  );
}