import type { Context } from "hono";

export const catchAsync = (fn: (c: Context, next?: any) => Promise<any> | any) => {
	return async (c: Context, next?: any) => {
		try {
			return await fn(c, next);
		} catch (error) {
			throw error;
		}
	};
};
