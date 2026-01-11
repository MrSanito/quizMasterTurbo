import { Request, Response } from "express";
import { prisma } from "@repo/db"; // ✅ FIXED import (package entry)
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

/* ================= TYPES ================= */

interface AuthBody {
  username?: string;
  email: string;
  password: string;
}

/* ================= LOGIN ================= */

export const login = async (req: Request<{}, {}, AuthBody>, res: Response) => {
  const { username, email, password } = req.body;

  console.log("username :", username);
  console.log("email :", email);
  console.log("password :", password);

  try {
    const existUser = await prisma.user.findUnique({
      where: { email },
    });

    console.log("existuser :", existUser);

    if (!existUser) {
      return res.status(404).json({
        success: false,
        message: "User Doesn't exists",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existUser.password
    );

    console.log("password match:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      { userId: existUser.id, email: existUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const hasSession = true;

    // res.cookie("token", token, {
    //   httpOnly: true,
 
    //   secure: true, // REQUIRED because Render is https
    //   sameSite: "none", // REQUIRED for cross-origin
    //   path: "/",
    //    maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    // res.cookie("hasSession", "true", {
    //   httpOnly: false, // OK, frontend can read
    //   secure: true, // 🔥 MUST be true
    //   sameSite: "none",
    //   path: "/",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,
    // });

    

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: existUser.id,
          email: existUser.email,
          username: existUser.username,
        },
        token,
        hasSession,
      },
    });
   } catch (error) {
    console.log("error : ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* ================= REGISTER ================= */

export const register = async (
  req: Request<{}, {}, AuthBody>,
  res: Response
) => {
  const { username, email, password } = req.body;

  console.log("username:", username);
  console.log("email:", email);

  try {
    const existUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existUser) {
      return res.status(409).json({
        success: false,
        message: "User Already Exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const savedUser = await prisma.user.create({
      data: {
        email,
        username: username!,
        password: hashedPassword,
      },
    });

    console.log("saved user", savedUser);

    return res.status(201).json({
      data: {
        username,
        email,
        password,
      },
      message: "Registration Done take your data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ================= CHECK USERNAME ================= */

export const checkUsername = async (
  req: Request<{}, {}, { username?: string }>,
  res: Response
) => {
  console.log("request recieved on check username");
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ available: false });
  }

  const isTaken = await prisma.user.findUnique({
    where: { username },
  });

  if (!isTaken) {
    return res.json({
      available: true,
      message: `${username} is available`,
    });
  }

  return res.status(200).json({
    message: "this username is Not available",
  });
};

/* ================= VERIFY USER ================= */

export const verifyUser = async (req: Request, res: Response) => {
  console.log("aa gayi bhai request");

  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // 🔒 TYPE GUARD (TS ONLY)
    if (typeof decoded === "string" || !("email" in decoded)) {
      return res.status(401).json({
        valid: false,
        success: false,
        message: "token is not valid",
      });
    }

    const email = (decoded as JwtPayload).email as string;

    const currentUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!currentUser) {
      return res.status(401).json({
        valid: false,
        success: false,
        message: "token is not valid",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: currentUser.id,
        name: currentUser.username,
        email: currentUser.email,
      },
    });
  } catch (error) {
    return res.status(401).json({
      valid: false,
      success: false,
      message: "token is not valid",
    });
  }
};
