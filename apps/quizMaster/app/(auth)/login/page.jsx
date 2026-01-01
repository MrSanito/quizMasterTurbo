"use client";

import React, { useState, useActionState } from "react";
import LoginForm from "@/app/features/auth/components/LoginForm";

const Login = () => {
  // const [state, formAction, isPending] = useActionState(registerAction, {});


  return (
    <div className="flex flex-col min-h-[80vh] justify-center items-center">
      <h3 className="text-3xl font-bold text-primary pb-6">Login Form </h3>

      <LoginForm/>
    </div>
  );
};

export default Login;
