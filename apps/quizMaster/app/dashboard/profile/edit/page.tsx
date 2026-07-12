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
import { useRouter } from "next/navigation";
 
import { FaUser, FaAt, FaEnvelope, FaSave } from "react-icons/fa";
import NotLoginComponent from "@/app/(auth)/components/NotLoginComponent";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Loading from "@/components/Loading";
import api from "@/app/lib/api";
import MaxTryReached from "@/app/(auth)/components/MaxTryReached";
import { useDebounce } from "@/app/features/hook/useDebouncer";
// Removed actions.ts import
import Grid from "@mui/material/Grid";
 

const avatars = Array.from({ length: 10 }, (_, i) => `avatar${i + 1}.svg`);

const ProfileEditPage = () => {
  const router = useRouter();


  const { user, guest, loading, isLogin, isGuest, isMaxTryReached, guestLeft, refreshAuth } =
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
    id: "",
    username: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [usernameStatus, setUsernameStatus] = useState(null);
  const debouncedUsername = useDebounce(form.username, 2000);
  const skipFirstUsernameCheck = React.useRef(true);

  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    setErrorMsg("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!form.username) errors.username = "Username is required";
    if (!form.firstName) errors.firstName = "First name is required";
    if (!form.lastName) errors.lastName = "Last name is required";
    if (!form.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Invalid email address";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSaving(false);
      return;
    }

    try {
      const res = await api.post("/auth/edit", {
        id: form.id,
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        avatar: selectedAvatar,
      });

      if (res.data?.success) {
        setSuccess(true);
        if (refreshAuth) {
          await refreshAuth();
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMsg(res.data?.message || "Failed to update profile");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  //  Fill form when user loads
  useEffect(() => {
    if (user) {
      skipFirstUsernameCheck.current = true; // mark this update as system update

      setForm({
        id: user.id || "",
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
      setSelectedAvatar(user.avatar || avatars[0]);
      console.log("selected avatar ---------------------", selectedAvatar);
    }
  }, [user]);
  const handleUsername = (e) => {
    let { name, value } = e.target;
    // 1 convert to lowercase
    value = value.toLowerCase();

    // 2 remove unwanted characters
    value = value.replace(/[^a-z0-9_]/g, "");

    setForm((prev) => ({ ...prev, [name]: value }));
    console.log(form);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

    // Handled in handleSubmit

  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus(null);
      return;
    }
    if (skipFirstUsernameCheck.current) {
      skipFirstUsernameCheck.current = false;
      return;
    }

    const runCheck = async () => {
      setUsernameStatus("checking");
      try {
        const res = await api.post("/auth/check_username", {
          username: debouncedUsername,
        });
        setUsernameStatus(res.data?.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    };

    runCheck();
  }, [debouncedUsername]);

  // 1 Loading (highest priority)
  if (loading) {
    return <Loading />;
  }

  // 2 Blocked guest
  if (isMaxTryReached) {
    return <MaxTryReached />;
  }

  // 3 Not logged in at all
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
        bgcolor: "var(--b1)", //  base-100 (page)
        p: 2,
      }}
    >
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 620 }}>
        <Card
          sx={{
            width: "100%",
            borderRadius: 4,
            bgcolor: "var(--b2)", //  base-200 (card surface)
            color: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Edit Profile
          </Typography>

          <form onSubmit={handleSubmit} suppressHydrationWarning>
            {/* Avatar Preview */}
            <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Avatar
                src={`/avatars/${selectedAvatar}`}
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
                    <Avatar
                      src={`/avatars/${avatar}`}
                      sx={{ width: 50, height: 50 }}
                    />
                  </IconButton>
                </Grid>
              ))}
            </Grid>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Username */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-lg font-semibold text-white">Username</legend>
                <input
                  type="text"
                  name="username"
                  className="input input-primary w-full"
                  placeholder="username"
                  value={form.username}
                  onChange={handleUsername}
                />
                 {fieldErrors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {fieldErrors.username}
                  </p>
                )}
                {usernameStatus === "checking" && (
                  <p className="text-yellow-500 text-sm mt-1">
                    Checking username... 
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="text-green-500 text-sm mt-1">{`${form.username} Username available `}</p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-red-500 text-sm mt-1">{`${form.username} Username already taken `}</p>
                )}
              </fieldset>

              {/* First Name & Last Name */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1">
                  <fieldset className="fieldset w-full">
                    <legend className="fieldset-legend text-lg font-semibold text-white">
                      First Name
                    </legend>
                    <input
                      type="text"
                      name="firstName"
                      className="input input-primary w-full"
                      placeholder="Joe"
                      value={form.firstName}
                      onChange={handleChange}
                    />
                  </fieldset>
                  {fieldErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <fieldset className="fieldset w-full">
                    <legend className="fieldset-legend text-lg font-semibold text-white">
                      Last Name
                    </legend>
                    <input
                      type="text"
                      name="lastName"
                      className="input input-primary w-full"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={handleChange}
                    />
                  </fieldset>
                  {fieldErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-lg font-semibold text-white">Email</legend>
                <input
                  type="text"
                  name="email"
                  className="input input-primary w-full"
                  placeholder="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </fieldset>
            </div>
            
            <input type="hidden" name="avatar" value={selectedAvatar} />
            <input type="hidden" name="id" value={form.id} />

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={
                  isSaving ||
                  usernameStatus === "checking" ||
                  usernameStatus === "taken"
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* SUCCESS / ERROR Messages */}
            {success && (
              <p className="text-green-500 text-sm text-center mt-2">
                Changes Saved Successfully 
              </p>
            )}
            {errorMsg && (
              <p className="text-red-500 text-sm text-center mt-2">{errorMsg}</p>
            )}
          </form>
        </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default ProfileEditPage;
