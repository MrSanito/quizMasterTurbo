"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  Clock, 
  Search, 
  X, 
  Check, 
  UserX,
  UserRoundCheck
} from "lucide-react";
import api from "@/app/lib/api";
import { toast } from "react-toastify";

interface UserInfo {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string;
  email: string;
}

interface FriendItem {
  friendshipId: string;
  user: UserInfo;
  createdAt: string;
}

interface RequestItem {
  requestId: string;
  user: UserInfo;
  createdAt: string;
}

interface SearchUserItem extends UserInfo {
  friendshipStatus: "NONE" | "ACCEPTED" | "PENDING_INCOMING" | "PENDING_OUTGOING";
  friendshipId: string | null;
}

const FriendRequest = () => {
  const [activeTab, setActiveTab] = useState<"friends" | "pending" | "add">("friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<SearchUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch friends and pending requests on load
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/friends");
      if (res.data.success) {
        setFriends(res.data.friends || []);
        setIncoming(res.data.incoming || []);
        setOutgoing(res.data.outgoing || []);
      }
    } catch (err: any) {
      console.error("Error fetching friends data:", err);
      toast.error("Failed to load friend details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoverUsers = async () => {
    try {
      setDiscoverLoading(true);
      const res = await api.get("/friends/discover");
      if (Array.isArray(res.data)) {
        const formatted: SearchUserItem[] = res.data.map((u: any) => ({
          ...u,
          friendshipStatus: "NONE",
          friendshipId: null,
        }));
        setDiscoverUsers(formatted);
      }
    } catch (err) {
      console.error("Error fetching discover users:", err);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDiscoverUsers();
  }, []);

  // Debounced/Triggered User Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setSearchResults(res.data.users || []);
        }
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Actions
  const handleSendRequest = async (username: string, userId: string) => {
    setActionLoadingId(userId);
    try {
      const res = await api.post("/friends/request", { username });
      if (res.data.success) {
        toast.success(`Friend request sent to @${username}`);
        
        // Update search results status locally
        setSearchResults(prev => 
          prev.map(u => u.id === userId 
            ? { ...u, friendshipStatus: "PENDING_OUTGOING", friendshipId: res.data.friendRequest.id } 
            : u
          )
        );
        setDiscoverUsers(prev => 
          prev.map(u => u.id === userId 
            ? { ...u, friendshipStatus: "PENDING_OUTGOING", friendshipId: res.data.friendRequest.id } 
            : u
          )
        );
        fetchData(); // Sync tabs background
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send friend request";
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      const res = await api.post("/friends/accept", { requestId });
      if (res.data.success) {
        toast.success("Friend request accepted!");
        
        // Update states locally
        const acceptedReq = incoming.find(r => r.requestId === requestId);
        if (acceptedReq) {
          setIncoming(prev => prev.filter(r => r.requestId !== requestId));
          setFriends(prev => [
            ...prev, 
            { friendshipId: res.data.friendship.id, user: acceptedReq.user, createdAt: new Date().toISOString() }
          ]);
        }
        
        // Also update any search results status locally
        if (acceptedReq) {
          setSearchResults(prev => 
            prev.map(u => u.id === acceptedReq.user.id 
              ? { ...u, friendshipStatus: "ACCEPTED", friendshipId: res.data.friendship.id } 
              : u
            )
          );
          setDiscoverUsers(prev => 
            prev.map(u => u.id === acceptedReq.user.id 
              ? { ...u, friendshipStatus: "ACCEPTED", friendshipId: res.data.friendship.id } 
              : u
            )
          );
        }
      }
    } catch (err: any) {
      toast.error("Failed to accept friend request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string, isIncoming = true) => {
    setActionLoadingId(requestId);
    try {
      const res = await api.post("/friends/decline", { requestId });
      if (res.data.success) {
        toast.info(isIncoming ? "Friend request declined" : "Friend request cancelled");
        
        if (isIncoming) {
          setIncoming(prev => prev.filter(r => r.requestId !== requestId));
        } else {
          setOutgoing(prev => prev.filter(r => r.requestId !== requestId));
        }

        // Reset search results locally
        setSearchResults(prev => 
          prev.map(u => u.friendshipId === requestId 
            ? { ...u, friendshipStatus: "NONE", friendshipId: null } 
            : u
          )
        );
        setDiscoverUsers(prev => 
          prev.map(u => u.friendshipId === requestId 
            ? { ...u, friendshipStatus: "NONE", friendshipId: null } 
            : u
          )
        );
      }
    } catch (err: any) {
      toast.error("Operation failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string, friendUserId: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) return;
    
    setActionLoadingId(friendshipId);
    try {
      const res = await api.post("/friends/remove", { friendshipId });
      if (res.data.success) {
        toast.success(`Removed ${friendName} from friends`);
        setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        
        // Reset search results locally
        setSearchResults(prev => 
          prev.map(u => u.id === friendUserId 
            ? { ...u, friendshipStatus: "NONE", friendshipId: null } 
            : u
          )
        );
      }
    } catch (err: any) {
      toast.error("Failed to remove friend");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getAvatarUrl = (avatarName: string) => {
    return avatarName ? `/avatars/${avatarName}` : "/avatars/avatar1.svg";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Decorative subtle background gradient, echoes the hero's palette */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7047C7]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F0DE4A]/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-gray-900 text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Users className="text-[#7047C7] w-7 h-7" />
              Social Hub
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Connect with fellow quiz takers, challenge them, and view your friends circle.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "friends"
                  ? "bg-[#7047C7] text-white shadow-md shadow-[#7047C7]/25"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Friends
              {friends.length > 0 && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === "friends" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {friends.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "pending"
                  ? "bg-[#7047C7] text-white shadow-md shadow-[#7047C7]/25"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending
              {incoming.length > 0 && (
                <span className="animate-pulse bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                  {incoming.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("add")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "add"
                  ? "bg-[#7047C7] text-white shadow-md shadow-[#7047C7]/25"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Add Friend
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7047C7]/20 border-t-[#7047C7]" />
            <p className="text-gray-500 text-sm mt-3">Loading Social Hub...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "friends" && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {friends.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-700 font-bold text-lg">No friends yet</h3>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                      Search for users in the "Add Friend" tab to expand your quiz circle.
                    </p>
                    <button
                      onClick={() => setActiveTab("add")}
                      className="mt-4 inline-flex items-center rounded-full bg-[#7047C7] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#5B32B4]"
                    >
                      Find Friends
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((item) => (
                      <motion.div
                        key={item.friendshipId}
                        layout
                        className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-gray-200 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-full border border-gray-200">
                              <img src={getAvatarUrl(item.user.avatar)} alt="avatar" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold text-sm tracking-wide">
                              {item.user.firstName || item.user.lastName
                                ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                                : item.user.email.split("@")[0]}
                            </span>
                            <span className="text-gray-500 text-xs font-semibold">@{item.user.username}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFriend(item.friendshipId, item.user.username, item.user.id)}
                          disabled={actionLoadingId === item.friendshipId}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                          title="Remove Friend"
                        >
                          {actionLoadingId === item.friendshipId ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                          ) : (
                            <UserMinus className="w-4 h-4" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "pending" && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Incoming Requests */}
                <div className="space-y-3">
                  <h3 className="text-gray-500 font-semibold text-sm tracking-wider uppercase">
                    Incoming Requests ({incoming.length})
                  </h3>

                  {incoming.length === 0 ? (
                    <div className="text-center py-6 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm">
                      No incoming pending requests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {incoming.map((item) => (
                        <div
                          key={item.requestId}
                          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded-full border border-gray-200">
                                <img src={getAvatarUrl(item.user.avatar)} alt="avatar" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-bold text-sm">
                                {item.user.firstName || item.user.lastName
                                  ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                                  : item.user.email.split("@")[0]}
                              </span>
                              <span className="text-gray-500 text-xs font-semibold">@{item.user.username}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(item.requestId)}
                              disabled={actionLoadingId === item.requestId}
                              className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {actionLoadingId === item.requestId ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(item.requestId, true)}
                              disabled={actionLoadingId === item.requestId}
                              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outgoing Requests */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-gray-500 font-semibold text-sm tracking-wider uppercase">
                    Sent Requests ({outgoing.length})
                  </h3>

                  {outgoing.length === 0 ? (
                    <div className="text-center py-6 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm">
                      No pending sent requests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {outgoing.map((item) => (
                        <div
                          key={item.requestId}
                          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded-full border border-gray-200">
                                <img src={getAvatarUrl(item.user.avatar)} alt="avatar" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-bold text-sm">
                                {item.user.firstName || item.user.lastName
                                  ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                                  : item.user.email.split("@")[0]}
                              </span>
                              <span className="text-gray-500 text-xs font-semibold">@{item.user.username}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeclineRequest(item.requestId, false)}
                            disabled={actionLoadingId === item.requestId}
                            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          >
                            {actionLoadingId === item.requestId ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                            ) : (
                              "Cancel"
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "add" && (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-5 h-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full bg-white border border-gray-200 text-gray-800 pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-[#7047C7] focus:ring-4 focus:ring-[#7047C7]/10 transition-all font-medium placeholder-gray-400 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                {searchLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#7047C7]/20 border-t-[#7047C7]" />
                    <p className="text-gray-500 text-xs mt-2">Searching users...</p>
                  </div>
                ) : searchQuery.trim() ? (
                  searchResults.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      <UserX className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      No users found matching "{searchQuery}"
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-gray-500 font-semibold text-xs tracking-wider uppercase pl-1">
                        Search Results
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-12 h-12 rounded-full border border-gray-200">
                                  <img src={getAvatarUrl(user.avatar)} alt="avatar" />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-900 font-bold text-sm">
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                    : user.email.split("@")[0]}
                                </span>
                                <span className="text-gray-500 text-xs font-semibold">@{user.username}</span>
                              </div>
                            </div>

                            {/* Friendship Status Actions */}
                            <div>
                              {user.friendshipStatus === "NONE" && (
                                <button
                                  onClick={() => handleSendRequest(user.username, user.id)}
                                  disabled={actionLoadingId === user.id}
                                  className="flex items-center gap-1.5 rounded-full bg-[#7047C7] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#5B32B4] disabled:opacity-50"
                                >
                                  {actionLoadingId === user.id ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                  Add Friend
                                </button>
                              )}

                              {user.friendshipStatus === "ACCEPTED" && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-200">
                                  <UserRoundCheck className="w-4 h-4" />
                                  Friends
                                </span>
                              )}

                              {user.friendshipStatus === "PENDING_OUTGOING" && (
                                <button
                                  onClick={() => user.friendshipId && handleDeclineRequest(user.friendshipId, false)}
                                  disabled={actionLoadingId === user.friendshipId}
                                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                >
                                  {actionLoadingId === user.friendshipId ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                                  ) : (
                                    "Cancel Request"
                                  )}
                                </button>
                              )}

                              {user.friendshipStatus === "PENDING_INCOMING" && (
                                <button
                                  onClick={() => user.friendshipId && handleAcceptRequest(user.friendshipId)}
                                  disabled={actionLoadingId === user.friendshipId}
                                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {actionLoadingId === user.friendshipId ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  Accept
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-gray-500 font-extrabold text-sm tracking-wide uppercase pl-1">
                      Discover Players
                    </h4>
                    {discoverLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#7047C7]/20 border-t-[#7047C7]" />
                      </div>
                    ) : discoverUsers.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-sm">
                        No new players to discover at the moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {discoverUsers.map((user) => (
                          <div
                            key={user.id}
                            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-gray-200 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-12 h-12 rounded-full border border-gray-200">
                                  <img src={getAvatarUrl(user.avatar)} alt="avatar" />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-gray-900 font-bold text-sm">
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                    : user.email.split("@")[0]}
                                </span>
                                <span className="text-gray-500 text-xs font-semibold">@{user.username}</span>
                              </div>
                            </div>

                            {/* Friendship Status Actions */}
                            <div>
                              {user.friendshipStatus === "NONE" && (
                                <button
                                  onClick={() => handleSendRequest(user.username, user.id)}
                                  disabled={actionLoadingId === user.id}
                                  className="flex items-center gap-1.5 rounded-full bg-[#7047C7] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#5B32B4] disabled:opacity-50"
                                >
                                  {actionLoadingId === user.id ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                  Add Friend
                                </button>
                              )}

                              {user.friendshipStatus === "PENDING_OUTGOING" && (
                                <button
                                  onClick={() => user.friendshipId && handleDeclineRequest(user.friendshipId, false)}
                                  disabled={actionLoadingId === user.friendshipId}
                                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                >
                                  {actionLoadingId === user.friendshipId ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                                  ) : (
                                    "Cancel Request"
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default FriendRequest;