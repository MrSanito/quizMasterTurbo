import type { NextFunction, Request, Response } from "express";

export const TryCatch = (handler : Function  )  =>   {
 return async (req : Request, res : Response, next : NextFunction) => {
        try {
            await handler(req, res, next)
            
        } catch (error : any) {

            console.log("--------- this is the error", error)
            res.status(500).json({
                success: false, 
                message : error.message
            })
            
        }
        
    }}