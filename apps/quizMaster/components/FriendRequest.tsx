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
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
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

  useEffect(() => {
    fetchData();
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
      <div className="bg-[#151b23] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
          <div>
            <h2 className="text-white text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Users className="text-blue-400 w-7 h-7" />
              Social Hub
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Connect with fellow quiz takers, challenge them, and view your friends circle.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-900 p-1.5 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "friends"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Friends
              {friends.length > 0 && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === "friends" ? "bg-white/20 text-white" : "bg-gray-800 text-gray-400"
                }`}>
                  {friends.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "pending"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "text-gray-400 hover:text-white"
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
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                  : "text-gray-400 hover:text-white"
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
            <span className="loading loading-spinner loading-md text-blue-400"></span>
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
                  <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <h3 className="text-gray-300 font-bold text-lg">No friends yet</h3>
                    <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                      Search for users in the "Add Friend" tab to expand your quiz circle.
                    </p>
                    <button
                      onClick={() => setActiveTab("add")}
                      className="btn bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg mt-4 px-6 btn-sm font-semibold"
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
                        className="bg-gray-900 border border-gray-800/80 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-12 h-12 rounded-full border border-gray-700">
                              <img src={getAvatarUrl(item.user.avatar)} alt="avatar" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm tracking-wide">
                              {item.user.firstName || item.user.lastName
                                ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                                : item.user.email.split("@")[0]}
                            </span>
                            <span className="text-gray-400 text-xs font-semibold">@{item.user.username}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFriend(item.friendshipId, item.user.username, item.user.id)}
                          disabled={actionLoadingId === item.friendshipId}
                          className="btn btn-ghost hover:bg-red-500/10 hover:text-red-400 text-gray-400 btn-circle btn-sm transition-all"
                          title="Remove Friend"
                        >
                          {actionLoadingId === item.friendshipId ? (
                            <span className="loading loading-spinner loading-xs"></span>
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
                  <h3 className="text-white font-semibold text-sm tracking-wider uppercase text-gray-500">
                    Incoming Requests ({incoming.length})
                  </h3>

                  {incoming.length === 0 ? (
                    <div className="text-center py-6 border border-gray-800 rounded-xl bg-gray-900/10 text-gray-500 text-sm">
                      No incoming pending requests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {incoming.map((item) => (
                        <div
                          key={item.requestId}
                          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded-full border border-gray-700">
                                <img src={getAvatarUrl(item.user.avatar)} alt="avatar" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-sm">
                                {item.user.firstName || item.user.lastName
                                  ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                                  : item.user.email.split("@")[0]}
                              </span>
                              <span className="text-gray-400 text-xs font-semibold">@{item.user.username}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(item.requestId)}
                              disabled={actionLoadingId === item.requestId}
                              className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-none rounded-lg font-bold"
                            >
                              {actionLoadingId === item.requestId ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(item.requestId, true)}
                              disabled={actionLoadingId === item.requestId}
                              className="btn btn-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border-none rounded-lg"
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
                <div className="space-y-3 pt-4 border-t border-gray-800/60">
                  <h3 className="text-white font-semibold text-sm tracking-wider uppercase text-gray-500">
                    Sent Requests ({outgoing.length})
                  </h3>

                  {outgoing.length === 0 ? (
                    <div className="text-center py-6 border border-gray-800 rounded-xl bg-gray-900/10 text-gray-500 text-sm">
                      No pending sent requests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {outgoing.map((item) => (
                        <div
                          key={item.requestId}
                          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded-full border border-gray-700">
                                <img src={getAvatarUrl(item.user.avatar)} alt="avatar" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-sm">
                                {item.user.firstName || item.user.lastName
                                  ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim()
                                  : item.user.email.split("@")[0]}
                              </span>
                              <span className="text-gray-400 text-xs font-semibold">@{item.user.username}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeclineRequest(item.requestId, false)}
                            disabled={actionLoadingId === item.requestId}
                            className="btn btn-sm bg-gray-800 hover:bg-red-500/15 hover:text-red-400 text-gray-400 border-none rounded-lg"
                          >
                            {actionLoadingId === item.requestId ? (
                              <span className="loading loading-spinner loading-xs"></span>
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
                    <Search className="h-5 h-5 text-gray-500" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full bg-gray-900 border border-gray-800 text-white pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-blue-500 transition-all font-medium placeholder-gray-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Search Results */}
                {searchLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="loading loading-spinner loading-sm text-blue-500"></span>
                    <p className="text-gray-500 text-xs mt-2">Searching users...</p>
                  </div>
                ) : searchQuery.trim() ? (
                  searchResults.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">
                      <UserX className="w-10 h-10 text-gray-600 mx-auto mb-2" />
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
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-12 h-12 rounded-full border border-gray-700">
                                  <img src={getAvatarUrl(user.avatar)} alt="avatar" />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-sm">
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                    : user.email.split("@")[0]}
                                </span>
                                <span className="text-gray-400 text-xs font-semibold">@{user.username}</span>
                              </div>
                            </div>

                            {/* Friendship Status Actions */}
                            <div>
                              {user.friendshipStatus === "NONE" && (
                                <button
                                  onClick={() => handleSendRequest(user.username, user.id)}
                                  disabled={actionLoadingId === user.id}
                                  className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg font-bold"
                                >
                                  {actionLoadingId === user.id ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                  Add Friend
                                </button>
                              )}

                              {user.friendshipStatus === "ACCEPTED" && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">
                                  <UserRoundCheck className="w-4 h-4" />
                                  Friends
                                </span>
                              )}

                              {user.friendshipStatus === "PENDING_OUTGOING" && (
                                <button
                                  onClick={() => user.friendshipId && handleDeclineRequest(user.friendshipId, false)}
                                  disabled={actionLoadingId === user.friendshipId}
                                  className="btn btn-sm bg-gray-800 hover:bg-red-500/10 hover:text-red-400 text-gray-400 border-none rounded-lg font-bold"
                                >
                                  {actionLoadingId === user.friendshipId ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    "Cancel Request"
                                  )}
                                </button>
                              )}

                              {user.friendshipStatus === "PENDING_INCOMING" && (
                                <button
                                  onClick={() => user.friendshipId && handleAcceptRequest(user.friendshipId)}
                                  disabled={actionLoadingId === user.friendshipId}
                                  className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-none rounded-lg font-bold"
                                >
                                  {actionLoadingId === user.friendshipId ? (
                                    <span className="loading loading-spinner loading-xs"></span>
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
                  <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-900/10 text-gray-500 text-sm">
                    Enter a username or email address to search for players.
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