"use client";
import React, { useActionState, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
   Avatar,
  IconButton,
  Button,
  Stack,
  InputAdornment,
} from "@mui/material";

import { FaUser, FaAt, FaEnvelope, FaSave } from "react-icons/fa";
import NotLoginComponent from "@/app/(auth)/components/NotLoginComponent";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import MaxTryReached from "@/app/(auth)/components/MaxTryReached";
import { useDebounce } from "@/app/features/hook/useDebouncer";
import { checkUsername, registerAction } from "@/app/features/auth/actions";
import Grid from "@mui/material/Grid";


const avatars = Array.from(
  { length: 10 },
  (_, i) => `/avatars/avatar${i + 1}.svg`,
);

const ProfileEditPage = () => {
  const { user, guest, loading, isLogin, isGuest, isMaxTryReached, guestLeft } =
    useUser();

  const viewerId =
    !loading && isLogin
      ? user?.id
      : !loading && isGuest
        ? guest?.id
        : undefined;

  const viewerType = isLogin ? "user" : "guest";

  console.log(viewerId, viewerType);
  console.log("user data", user);

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
  });
  const [usernameStatus, setUsernameStatus] = useState(null);
  const debouncedUsername = useDebounce(form.username, 2000);

  const initialState = {
    success: false,
    errors: {},
  };

  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  // ✅ Fill form when user loads
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
      });
      setSelectedAvatar(user.avatar || avatars[0]);
    }
  }, [user]);
  const handleUsername = (e) => {
    let { name, value } = e.target;
    // 1️⃣ convert to lowercase
    value = value.toLowerCase();

    // 2️⃣ remove unwanted characters
    value = value.replace(/[^a-z0-9_]/g, "");

    setForm((prev) => ({ ...prev, [name]: value }));
    console.log(form);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus(null);
      return;
    }

    const runCheck = async () => {
      setUsernameStatus("checking");

      const res = await checkUsername(debouncedUsername);
      console.log(res);

      setUsernameStatus(res?.available ? "available" : "taken");
    };

    runCheck();
  }, [debouncedUsername]);

  // 1️⃣ Loading (highest priority)
  if (loading) {
    return <Loading />;
  }

  // 2️⃣ Blocked guest
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  // 3️⃣ Not logged in at all
  if (!isLogin && !isGuest) {
    return <NotLoginComponent />;
  }

  // console.log(user.name)

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "var(--b1)", // 🌍 base-100 (page)
        p: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 4,
          bgcolor: "var(--b2)", // 🧱 base-200 (card surface)
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Edit Profile
          </Typography>

          <form action={formAction} suppressHydrationWarning>
            {/* Avatar Preview */}
            <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Avatar
                src={selectedAvatar}
                sx={{
                  width: 95,
                  height: 95,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                  border: "3px solid var(--b1)",
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Choose your avatar
              </Typography>
            </Stack>
            <Grid
              container
              spacing={1.5}
              justifyContent="center"
              sx={{ mb: 3 }}
            >
              {avatars.map((avatar) => (
                <Grid key={avatar} size={3}>
                  <IconButton
                    onClick={() => setSelectedAvatar(avatar)}
                    sx={{
                      border:
                        selectedAvatar === avatar
                          ? "2px solid #1976d2"
                          : "2px solid transparent",
                      borderRadius: "50%",
                      p: 0.5,
                    }}
                  >
                    <Avatar src={avatar} sx={{ width: 50, height: 50 }} />
                  </IconButton>
                </Grid>
              ))}
            </Grid>

            {/* Form Fields */}
            <Stack
              spacing={2}
              sx={{
                "& .MuiInputBase-input": { color: "#fff" },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&:hover fieldset": { borderColor: "#fff" },
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
              }}
            >
              {" "}
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-xl">Username</legend>
                <FaUser color="white" size={16} />

                <input
                  type="text"
                  name="username"
                  className="input input-primary w-64"
                  placeholder="username"
                  value={form.username}
                  onChange={handleUsername}
                />
                {state.errors?.username && (
                  <p className="text-red-500 text-sm">
                    {state.errors.username}
                  </p>
                )}
                {usernameStatus === "checking" && (
                  <p className="text-yellow-500 text-sm">
                    Checking username… ⏳
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-green-500 text-sm">{`${form.username} Username available ✅`}</p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-red-500 text-sm">{`${form.username} Username already taken ❌`}</p>
                )}
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-xl">Name</legend>
                <FaUser color="white" size={16} />

                <input
                  type="text"
                  name="Name"
                  className="input input-primary w-64"
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-xl">Email</legend>
                <FaUser color="white" size={16} />

                <input
                  type="text"
                  name="name"
                  className="input input-primary w-64"
                  placeholder="Name"
                  value={form.email}
                  onChange={handleChange}
                />
              </fieldset>
            </Stack>

            {/* Save Button */}
            <button type="submit" className="btn btn-primary">
              {isPending ? "Saving..." : "Saved"}
            </button>
            {/* SUCCESS */}
            {state.success && (
              <p className="text-green-600 text-sm">
                Changes Saved Successfully 🎉
              </p>
            )}
            {!state.success && state.message && (
              <p className="text-red-600 text-sm mt-2">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};;

export default ProfileEditPage;
