  import { TryCatch } from "../middleware/tryCatch";
  import { LoginSchema, RegisterSchema, ValidateLoginSchema, ValidateRegisterSchema } from "@repo/types";
  import bcrypt from "bcrypt"
  import redis from "@repo/redis";
  import { sendMail } from "../configs/sendEmail";
  import crypto from "crypto";
  import { getOtpHtml, getVerifyEmailHtml } from "../configs/email";


  import { Request, Response } from "express"
  import { prisma } from "@repo/db";
  import { sendResendEmail } from "../configs/resend";
  import { computeJwkThumbprint, familyKey, generateAccessToken, generateRefreshToken, otpKey, rtKey, userCacheKey, verifyDpopProof, verifyRefreshToken } from "./auth.services";

  const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

  const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

  export const register = TryCatch( async (req : Request , res : Response ) => {

    const parsed = RegisterSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log(parsed);
      return res.status(409).json(parsed.error);
    }

    console.log("successfully pasrsed");

    const {email,firstName , lastName , password, username} = parsed.data;

    const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;

    const isAllowed = await redis.set(rateLimitKey, "1", "EX", 60, "NX");

    if (!isAllowed) {
      return res.status(429).json({
        success: "false",
        message: "Too Many Reuqests",
      });
    }

    const isExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (isExist) {
      return res.status(404).json({
        success: "false",
        message: "User Already Exists",
      });
    }

    // generate password

    const hashedPassword = await bcrypt.hash(password, 12);

    // save token
    const name = `${firstName} ${lastName}`;

    const verifyToken = crypto.randomBytes(32).toString("hex");

  
    const dataToStore = JSON.stringify({
      firstName,
      lastName,
      username,
      email,
      password : hashedPassword,
    });

    const savedToken = await redis.set(
      `verifyKey:${verifyToken}`,
      dataToStore,
      "EX",
      300,
      "NX",
    );

    console.log("token is saved", verifyToken);

    const html = getVerifyEmailHtml({ token: verifyToken.toString(), email });

  //   const sendEmail = await sendMail(email, "Verify your email", html);

  const sendEmail = await sendResendEmail({to:email, subject: "verify" ,html})
    console.log(sendEmail);

    if (!sendEmail) {
      return res.status(400).json({
        success: "false",
        message: "Failed to send OTP",
      });
    }

    await redis.set(rateLimitKey, "true", "EX", 60, "NX");

    res.status(200).json({
      success : true, 
      message : "If your email is right then check your inbox "
    })

  })  

  export const verify = TryCatch( async (req:Request , res:Response) => {
      console.log(req.params)
      const unvalidated = {
    
        token: String(req.params.token ?? "")
          .toLowerCase()
          .trim(),
      };

      const parsed = ValidateRegisterSchema.safeParse(unvalidated);

      console.log(parsed);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const stored = await redis.get(`verifyKey:${parsed.data.token}`);
      if (!stored) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token" });
      }

  
      



      
  const {firstName, lastName,  email,username,password} = JSON.parse(stored);


    

      const alreadyExist = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      console.log("if user exists", alreadyExist);
      if (alreadyExist) {
        return res.status(409).json({
          success: "false",
          message: "User Already Exists",
        });
      }

      await prisma.user.create({
        data: { email, firstName, lastName,username, password },
      });

      await redis.del(`verifyKey:${parsed.data.token}`);

      return res.status(201).json({
        success: "true",
        message: "User registered successfully",
      });
  })
  export const login = TryCatch( async (req:Request , res:Response) => {


    const parsed = LoginSchema.safeParse(req.body);
  
    console.log(parsed.data)
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Same response for non-existent and wrong password — prevents user enumeration
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // NX means "only set if not already set" — prevents OTP spam
    const stored = await redis.set(otpKey(email), otp, "EX", 300, "NX");
    if (!stored) {
      return res.status(429).json({ success: false, message: "OTP already sent. Wait 5 minutes." });
    }

    const html = getOtpHtml({ email, otp });
    const sent = await sendResendEmail({to:email , subject:"Login OTP" , html});
    if (!sent) {
      await redis.del(otpKey(email));
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

    return res.status(200).json({ success: true, message: "OTP sent to your email" });
  })

  export const verifyLoginOTP = TryCatch( async (req:Request , res:Response) => {
  // Rate limit: 5 wrong OTP attempts per 5 min per IP+email
      const rateKey = `login-otp-rate:${req.ip}:${req.body.email}`;
      const attempts = await redis.incr(rateKey);
      if (attempts === 1) await redis.expire(rateKey, 5 * 60);
      if (attempts > 5) {
        return res.status(429).json({
          success: false,
          message: "Too many attempts. Wait 5 minutes.",
        });
      }

      const parsed = ValidateLoginSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const { email, otp, publicKeyJwk, browser, os, deviceType, deviceName } =
        parsed.data;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Validate OTP
      const storedOtp = await redis.get(otpKey(email));
      if (!storedOtp) {
        return res.status(400).json({ success: false, message: "OTP expired" });
      }
      if (storedOtp !== otp) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      // Clean up OTP + rate limit on success
      await redis.del(otpKey(email));
      await redis.del(rateKey);

      // ── Session identifiers ──────────────────────────────────────────────────
      const sessionId = crypto.randomUUID();  // stable across rotations
      const familyId  = crypto.randomUUID();  // unique to this login event

      // ── PoP: compute thumbprint from client's public key ────────────────────
      let publicKeyThumbprint: string | undefined;
      if (publicKeyJwk) {
        console.log("public key jwk", publicKeyJwk)
        publicKeyThumbprint = await computeJwkThumbprint(publicKeyJwk);
      }


      // ── Issue tokens ─────────────────────────────────────────────────────────
      const refreshToken = generateRefreshToken(user.id, sessionId, familyId);
      generateAccessToken(user.id, sessionId, familyId, res); // sets cookie

      const TTL = 7 * 24 * 60 * 60; // 7 days in seconds

      // Store this token per-session (not per-user — that was the bug)
      const pipeline = redis.pipeline();
      pipeline.set(rtKey(user.id, familyId, sessionId), refreshToken, "EX", TTL);
      // family set lets us wipe all sessions in a family on theft detection
      pipeline.sadd(familyKey(familyId), sessionId);
      pipeline.expire(familyKey(familyId), TTL);
      if (publicKeyJwk) {
        pipeline.set(`pubkey:${sessionId}`, JSON.stringify(publicKeyJwk), "EX", TTL);
      }
      await pipeline.exec();

      // Set refresh token cookie
      const isProd = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: TTL * 1000,
      });

      // Persist session to DB (for "active sessions" listing)
      await prisma.session.create({
        data: {
          id: sessionId,
          sessionToken: refreshToken,
          familyId,
          userId: user.id,
          expiresAt: new Date(Date.now() + TTL * 1000),
          ipAddress: req.ip ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          browser: browser ?? null,
          os: os ?? null,
          deviceType: deviceType ?? null,
          deviceName: deviceName ?? null,
          publicKeyThumbprint: publicKeyThumbprint ?? null,
        },
      });

      return res.status(200).json({ success: true, message: "Login successful" });
    
  })

  export const checkUsername = TryCatch( async (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ available: false });
    }

    const isTaken = await prisma.user.findUnique({
      where: { username },
    });

    if (!isTaken) {
      return res.json({
        success: true,
        available: true,
        message: `${username} is available`,
      });
    }

    return res.status(200).json({
      success: true,
      available: false,
      message: "this username is Not available",
    });
  });


  export const refreshTokenController = TryCatch(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    console.log("refresh token : ",refreshToken)
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    // 1. Verify JWT signature + expiry
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: "Session expired. Please log in." });
    }

    const { userId, sessionId, familyId } = decoded;

    // 2. Check Redis — is this EXACT token still valid?
    const storedToken = await redis.get(rtKey(userId, familyId, sessionId));

    if (!storedToken) {
      // Token not in Redis = it was already rotated or never existed.
      // This means REUSE DETECTED — wipe the entire family immediately.

      const sessionIds = await redis.smembers(familyKey(familyId));

      const pipeline = redis.pipeline();
      for (const sid of sessionIds) {
        pipeline.del(rtKey(userId, familyId, sid));
      }
      pipeline.del(familyKey(familyId));
      await pipeline.exec();

      // Revoke from DB too
      if (sessionIds.length > 0) {
        await prisma.session.deleteMany({
          where: { userId, familyId, id: { in: sessionIds } },
        });
      }

      // Invalidate user cache so any cached session info is gone
      await redis.del(userCacheKey(userId));

      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Token reuse detected. All sessions for this login have been revoked.",
      });
    }

    // 3. PoP verification (optional but recommended if client supports it)
    const dpopProof = req.headers["dpop-proof"] as string | undefined;

    if (dpopProof) {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });

      if (session?.publicKeyThumbprint) {
        // We need the full public JWK to verify. 
        // Store it in Redis at login for fast access here (don't want a DB round trip on every refresh).
        const storedJwk = await redis.get(`pubkey:${sessionId}`);
        console.log("storedJwk", storedJwk)
        console.log("dpopProof", dpopProof)
        if (storedJwk) {
          const popValid = await verifyDpopProof({
            proofJwt: dpopProof,
            publicKeyJwk: JSON.parse(storedJwk),
            expectedMethod: "POST",
            expectedUrl: `${BASE_URL}/api/v1/auth2/refresh`,
            jtiCache: {
              has: async (jti) => {
                const exists = await redis.exists(`dpop-jti:${jti}`);
                return exists === 1;
              },
              set: async (jti) => {
                await redis.set(`dpop-jti:${jti}`, "1", "EX", 60); // 60s replay window
              },
            },
          });

          if (!popValid) {
            return res.status(401).json({ success: false, message: "PoP proof invalid" });
          }
        }
      }
    }



    // 5. Rotate tokens — delete old, issue new
    await redis.del(rtKey(userId, familyId, sessionId));

    const newRefreshToken = generateRefreshToken(userId, sessionId, familyId);
    const TTL = 7 * 24 * 60 * 60;

    await redis.set(rtKey(userId, familyId, sessionId), newRefreshToken, "EX", TTL);

    generateAccessToken(userId, sessionId, familyId, res); // sets new access token cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: TTL * 1000,
    });

    // Keep DB session expiry rolling
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        sessionToken: newRefreshToken,
        expiresAt: new Date(Date.now() + TTL * 1000),
        lastUsedAt: new Date(),
      },
    });

    return res.status(200).json({ success: true, message: "Token refreshed" });
  });

  // ─── Validate user (me) ────────────────────────────────────────────────────────

  export const validateUser = TryCatch(async (req: Request, res: Response) => {
    const { userId } = req.user;

    const cached = await redis.get(userCacheKey(userId));
    if (cached) {
      return res.status(200).json({ success: true, user: JSON.parse(cached) });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const formattedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    await redis.set(userCacheKey(userId), JSON.stringify(formattedUser), "EX", 5 * 60);
    return res.status(200).json({ success: true, user: formattedUser });
  });

  // ─── Get all active sessions ───────────────────────────────────────────────────

  export const getAllSessions = TryCatch(async (req: Request, res: Response) => {
    const { userId, sessionId: currentSessionId } = req.user;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }, // only non-expired
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        ipAddress: true,
        browser: true,
        os: true,
        deviceType: true,
        deviceName: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });

    // Tag which one is the current session
    const withCurrent = sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));

    return res.status(200).json({ success: true, sessions: withCurrent });
  });

  // ─── Logout (single session) ───────────────────────────────────────────────────

  export const logout = TryCatch(async (req: Request, res: Response) => {
    const { userId, sessionId, familyId } = req.user;

    const pipeline = redis.pipeline();
    pipeline.del(rtKey(userId, familyId, sessionId));
    pipeline.srem(familyKey(familyId), sessionId);
    await pipeline.exec();

    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
      // session may already be gone — not an error
    });

    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: "Logged out" });
  });

  // ─── Logout all sessions ───────────────────────────────────────────────────────

  export const logoutAll = TryCatch(async (req: Request, res: Response) => {
    const { userId } = req.user;

    // Get all sessions from DB to find their familyIds
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: { id: true, familyId: true },
    });

    if (sessions.length > 0) {
      const pipeline = redis.pipeline();
      for (const s of sessions) {
        pipeline.del(rtKey(userId, s.familyId, s.id));
        pipeline.srem(familyKey(s.familyId), s.id);
      }
      // Delete unique families
      const uniqueFamilies = [...new Set(sessions.map((s) => s.familyId))];
      for (const fid of uniqueFamilies) {
        pipeline.del(familyKey(fid));
      }
      pipeline.del(userCacheKey(userId)); // clear user cache too
      await pipeline.exec();

      await prisma.session.deleteMany({ where: { userId } });
    }

    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: "All sessions revoked" });
  });

  // ─── Revoke a specific session (e.g. from device manager UI) ──────────────────

  export const revokeSession = TryCatch(async (req: Request, res: Response) => {
    const { userId } = req.user;
    const targetId = req.params.sessionId as string;

    const session = await prisma.session.findUnique({ where: { id: targetId } });
    if (!session || session.userId !== userId) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const pipeline = redis.pipeline();
    pipeline.del(rtKey(userId, session.familyId, targetId));
    pipeline.srem(familyKey(session.familyId), targetId);
    await pipeline.exec();

    await prisma.session.delete({ where: { id: targetId } });

    return res.status(200).json({ success: true, message: "Session revoked" });
  });

  // ─── Helper ───────────────────────────────────────────────────────────────────

  function clearAuthCookies(res: Response) {
    const isProd = process.env.NODE_ENV === "production";
    const opts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" as const : "lax" as const,
    };
    res.clearCookie("accessToken", opts);
    res.clearCookie("refreshToken", opts);
  }

  export const editUser = TryCatch(async (req: Request, res: Response) => {
    const { id, firstName, lastName, username, email, avatar } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to update.",
      });
    }

    const savedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        username,
        avatar,
      },
    });

    // Invalidate cached user profile in Redis
    await redis.del(`user:${id}`);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: savedUser,
    });
  }); 