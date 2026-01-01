import React from "react";
import { useState, useActionState, useRef, useEffect } from "react";

import { FiEye,FiEyeOff } from "react-icons/fi";
 import { loginAction } from "../actions";

const LoginForm = () => {


  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const initialState = {
    success: false,
    errors: {},
  };
    const toggleEyeHandler = () => {
      setShowPassword((prev) => !prev);
    };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    console.log(form);
  };
 

  
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  useEffect(() => {
  console.log("🧾 loginAction response:", state);
  }, [state]);


  return (
    <form action={formAction}>
      {/* <fieldset className="fieldset">
        {usingUserName ? <> its try boi</> : <> its false boi</>}

        <legend className="fieldset-legend text-xl">Username</legend>
        <input
          type="text"
          name="username"
          className="input input-primary w-64"
          placeholder="Type here"
          value={form.username}
          onChange={handleChange}
        />
      </fieldset>
      {state.errors?.username && (
        <p className="text-red-500 text-sm">{state.errors.username}</p>
      )} */}
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
            name="password"
            type={showPassword ? "text" : "password"}
            className="input input-primary w-64s"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-4"
            onClick={(e) => {
              toggleEyeHandler(e);
            }}
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
        <p className="text-red-500 text-sm">{state.errors.password  }</p>
      )}
      <button type="submit" className="btn btn-primary">
        {isPending ? "Registering..." : "Login"}
      </button>
      {/* SUCCESS */}
      {state.success && (
        <p className="text-green-600 text-sm">
          Login Successfully Wallah🎉
        </p>
      )}
    </form>
  );
};

export default LoginForm;
