import { Request, Response } from "express";
import { prisma } from "@repo/db/lib/prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  console.log("username :", username);
  console.log("email :", email);
  console.log("password :", password);

  // check if user exists or throw error

  try {
    //checking user details
    const existUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    console.log("existuser :", existUser);

    // if yes assign jwt
    if (!existUser) {
      return res.status(404).json({
        success: false,
        message: "User Doesn't exists",
      });
    }

    // ✅ user exists → password check → login
    // password check

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
      {
        expiresIn: "7d",
      }
    );

    console.log("token ", token);

    // Set cookie with proper attributes
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in prod (https), false for localhost
      sameSite: "lax", // Required for cross-origin requests
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

     console.log("🍪 Cookie attributes:", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: "7 days",
    });

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
      },
    });
  } catch (error) {
    // throw error
    console.log("error : ", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  console.log("username:", username);
  console.log("email:", email);

  try {
    // //check if user exists or not with db

    const existUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existUser) {
      return res.status(409).json({
        success: false,

        message: "User Already Exists",
      });
    }

    // password hash
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // save updated user and return response
    const savedUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    console.log("saved user", savedUser);

    // if register done return to the user
    res.status(201).json({
      data: {
        username: username,
        email: email,
        password: password,
      },
      message: "Registration Done take your data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

export const checkUsername = async (req: Request, res: Response) => {
  console.log("request recieved on check username");
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ available: false });
  }

  // fake DB check
  const isTaken = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });
  console.log("is Taken", isTaken);

  if (!isTaken) {
    return res.json({
      available: true,
      message: `${username} is available`,
    });
  }

  console.log("is Taken", isTaken);
  return res.status(200).json({
    message: "this username is Not available",
  });
  // return res.status(200).json({
  //   available: !isTaken,
  // });
};

export const verifyUser = (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ valid: false });
  }
  // verify user using jwt if yes then go ahead otherwise dont let user in
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    return res.status(200).json({
      valid: true,
      userId: (decoded as any).userId,
    });
  } catch (error) {
    return res.status(401).json({ valid: false });
  }
};
