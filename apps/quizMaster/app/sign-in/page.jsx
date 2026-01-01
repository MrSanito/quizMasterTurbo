"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Sign In</h2>
        <SignIn path="/sign-in" routing="path" />
      </div>
    </div>
  );
};

export default SignInPage;
