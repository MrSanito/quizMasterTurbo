import { Hono } from "hono";
import newAuthRouter from "../auth/auth.routes.js";
import friendsRoutes from "../friend/friend.routes.js";
import { logger } from "../utils/logger.js";
import categoriesRoutes from "./categories.route.js";
import gameRoutes from "./game.route.js";
import quizzesRoutes from "./quizzes.route.js";
import roomRoutes from "./room.route.js";

const apiRouter = new Hono();

// Error handling for API router
apiRouter.onError((err, c) => {
	logger.error(err, "--------- this is the error in apiRouter");
	return c.json(
		{
			success: false,
			message: err.message,
		},
		500,
	);
});

apiRouter.route("/auth", newAuthRouter);
apiRouter.route("/categories", categoriesRoutes);
apiRouter.route("/quizzes", quizzesRoutes);
apiRouter.route("/room", roomRoutes);
apiRouter.route("/game", gameRoutes);
apiRouter.route("/", friendsRoutes);

export default apiRouter;
