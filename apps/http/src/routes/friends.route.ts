import { Router } from "express";
import {
  getFriends,
  sendRequest,
  acceptRequest,
  declineRequest,
  removeFriend,
  searchUsers,
} from "../controllers/friends.controller.js";

const router = Router();

router.get("/", getFriends);
router.post("/request", sendRequest);
router.post("/accept", acceptRequest);
router.post("/decline", declineRequest);
router.post("/remove", removeFriend);
router.get("/search", searchUsers);

export default router;
