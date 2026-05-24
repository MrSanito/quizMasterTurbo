import { Router } from "express";
import { register, verify, login, verifyLoginOTP, validateUser, checkUsername } from "./auth.controllers";
import { isAuthenticated } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/verify/:token", verify);
router.post("/login", login);
router.post("/verifyLoginOTP", verifyLoginOTP);
router.post("/me", isAuthenticated, validateUser);
router.post("/check_username", checkUsername);

export default router;