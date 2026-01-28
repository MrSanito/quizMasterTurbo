
import { Request, Response } from "express";


export const createRoom = (req: Request, res: Response) => { 

    const roomId = req.params.roomId;

    console.log("create Room Request Received")
   return res.status(200).json({

     success: true,
     roomId ,
     message: "Success at Creating room",
   });}
export const getRoom = (req: Request, res: Response) => { 
    return res.status(200).json({
     success: true,
     message: "Success at Getting room",
   });}
export const getRoomResult = (req: Request, res: Response) => { 
    return res.status(200).json({
     success: true,
     message: "Success at Getting Result of  room",
   });}