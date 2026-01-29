import { Router } from "express";
import {
  login,
  register,
  checkUsername,
  verifyUser,
  editUser,
  logOutUser,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/check_username", checkUsername);
router.post("/verify_token", verifyUser);
router.post("/edit", editUser);
router.post("/logout", logOutUser);
 
export default router;
