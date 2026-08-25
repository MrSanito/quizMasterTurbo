import { Hono } from "hono";
import newAuthRouter from "../auth/auth.routes.js";
import friendsRoutes from "../friend/friend.routes.js";
import categoriesRoutes from "./categories.route.js";
import gameRoutes from "./game.route.js";
import quizzesRoutes from "./quizzes.route.js";
import roomRoutes from "./room.route.js";

const apiRouter = new Hono();

apiRouter.route("/auth", newAuthRouter);
apiRouter.route("/categories", categoriesRoutes);
apiRouter.route("/quizzes", quizzesRoutes);
apiRouter.route("/room", roomRoutes);
apiRouter.route("/game", gameRoutes);
apiRouter.route("/", friendsRoutes);

export default apiRouter;
