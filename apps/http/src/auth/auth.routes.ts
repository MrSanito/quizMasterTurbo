import { Router } from "express";
import {
	checkUsername,
	editUser,
	forgotPassword,
	getAllSessions,
	login,
	logout,
	logoutAll,
	refreshTokenController,
	register,
	revokeSession,
	validateUser,
	verify,
	verifyLoginOTP,
} from "./auth.controllers";
import { isAuthenticated } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/verify/:token", verify);
router.post("/login", login);
router.post("/verifyLoginOTP", verifyLoginOTP);
router.post("/me", isAuthenticated, validateUser);
router.post("/check_username", checkUsername);
router.post("/refresh", refreshTokenController);
router.post("/logout", isAuthenticated, logout);
router.post("/logoutall", isAuthenticated, logoutAll);
router.post("/revoke/:sessionId", isAuthenticated, revokeSession);
router.get("/sessions", isAuthenticated, getAllSessions);
router.post("/edit", isAuthenticated, editUser);
router.post("/forgot_password", forgotPassword);
export default router;
