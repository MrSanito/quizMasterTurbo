import { Hono } from "hono";
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

const authRouter = new Hono();

authRouter.post("/register", register);
authRouter.post("/verify/:token", verify);
authRouter.post("/login", login);
authRouter.post("/verifyLoginOTP", verifyLoginOTP);
authRouter.post("/me", isAuthenticated, validateUser);
authRouter.post("/check_username", checkUsername);
authRouter.post("/refresh", refreshTokenController);
authRouter.post("/logout", isAuthenticated, logout);
authRouter.post("/logoutall", isAuthenticated, logoutAll);
authRouter.post("/revoke/:sessionId", isAuthenticated, revokeSession);
authRouter.get("/sessions", isAuthenticated, getAllSessions);
authRouter.post("/edit", isAuthenticated, editUser);
authRouter.post("/forgot_password", forgotPassword);

export default authRouter;
