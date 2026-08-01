import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export const TryCatch = (handler : Function  )  =>   {
 return async (req : Request, res : Response, next : NextFunction) => {
        try {
            await handler(req, res, next)
            
        } catch (error : any) {

            logger.error(error, "--------- this is the error")
            res.status(500).json({
                success: false, 
                message : error.message
            })
            
        }
        
    }}