import { Router } from "express";
import { isAuthenticated } from "../auth/auth.middleware";
import {
  discoverFriends,
  sendRequest,
  listReceivedRequests,
  listSentRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  listFriends,
  removeFriend,
  friendshipStatus
} from "./friend.controller";

const router = Router();
// middleware to check if user authenticated or not ..
router.use(isAuthenticated);

// RESTful Friend Requests
router.post('/friend-requests', sendRequest);
router.get('/friend-requests/received', listReceivedRequests);
router.get('/friend-requests/sent', listSentRequests);
router.patch('/friend-requests/:id/accept', acceptRequest);
router.patch('/friend-requests/:id/reject', rejectRequest);
router.delete('/friend-requests/:id', cancelRequest);

// RESTful Friendships
router.get('/friends/discover', discoverFriends);
router.get('/friends', listFriends);
router.delete('/friends/:friendId', removeFriend);
router.get('/friends/status/:userId', friendshipStatus);

// RPC compatibility routes for frontend
router.post('/friends/request', sendRequest);
router.post('/friends/accept', acceptRequest);
router.post('/friends/decline', rejectRequest);
router.post('/friends/remove', removeFriend);
router.get('/friends/search', discoverFriends);

export default router;