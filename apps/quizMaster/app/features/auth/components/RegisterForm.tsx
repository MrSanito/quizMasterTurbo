"use client";

import React, { useState, useActionState, useEffect } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

import { registerAction, checkUsername } from "../actions";
import { useDebounce } from "../../hook/useDebouncer";
import { useRouter } from "next/navigation";


const RegisterForm = () => {
  // const [state, formAction, isPending] = useActionState(registerAction, {});
    const router = useRouter();
  

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [usernameStatus, setUsernameStatus] = useState(null)
  const debouncedUsername = useDebounce(form.username, 2000);

  const [showPassword, setShowPassword] = useState(false);
  const initialState = {
    success: false,
    errors: {},
  };

  const toggleEyeHandler = () => {
    setShowPassword((prev) => !prev);
  };

  // handle change

  const handleChange = (e) => {
    const { name, value } = e.target;
     setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleUsername = (e) => {
    let { name, value } = e.target;
    // 1️⃣ convert to lowercase
    value = value.toLowerCase();

    // 2️⃣ remove unwanted characters
    value = value.replace(/[^a-z0-9_]/g, "");

    setForm((prev) => ({ ...prev, [name]: value }));
  };;

  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus(null);
      return;
    }

    const runCheck = async () => {
      setUsernameStatus("checking");

      const res = await checkUsername(debouncedUsername);
      console.log(res)

      setUsernameStatus(res?.available ? "available" : "taken");
    };

    runCheck();
  }, [debouncedUsername]);

  useEffect(() => {
    if (!state.success) return;
  
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000); // ⏳ 3 seconds
  
    // cleanup (important!)
    return () => clearTimeout(timer);
  }, [state.success, router]);
  

  return (
    <form action={formAction} suppressHydrationWarning>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-xl">Username</legend>
        <input
          type="text"
          name="username"
          className="input input-primary w-64"
          placeholder="Type here"
          value={form.username}
          onChange={handleUsername}
        />
      </fieldset>
      {state.errors?.username && (
        <p className="text-red-500 text-sm">{state.errors.username}</p>
      )}
      {usernameStatus === "checking" && (
        <p className="text-yellow-500 text-sm">Checking username… ⏳</p>
      )}

      {usernameStatus === "available" && (
        <p className="text-green-500 text-sm">{`${form.username} Username available ✅`}</p>
      )}

      {usernameStatus === "taken" && (
        <p className="text-red-500 text-sm">{`${form.username} Username already taken ❌`}</p>
      )}

      <fieldset className="fieldset">
        <legend className="fieldset-legend text-xl">Email</legend>
        <input
          type="text"
          name="email"
          className="input input-primary w-64"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
      </fieldset>
      {state.errors?.email && (
        <p className="text-red-500 text-sm">{state.errors.email}</p>
      )}
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-xl">Password</legend>
        <div className="w-full relative">
          <input
            type={showPassword ? "text" : "password"}
            className="input input-primary w-64s"
            placeholder="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-4"
            onClick={toggleEyeHandler}
          >
            {showPassword ? (
              <FiEyeOff className="text text-primary" />
            ) : (
              <FiEye className="text text-primary" />
            )}
          </button>
        </div>
      </fieldset>
      {state.errors?.password && (
        <p className="text-red-500 text-sm">{state.errors.password}</p>
      )}
      <button type="submit" className="btn btn-primary">
        {isPending ? "Registering..." : "Register"}
      </button>
      {/* SUCCESS */}
      {state.success && (
        <p className="text-green-600 text-sm">
          Account created successfully 🎉
        </p>
      )}
      {!state.success && state.message && (
        <p className="text-red-600 text-sm mt-2">{state.message}</p>
      )}
    </form>
  );
};

export default RegisterForm;
