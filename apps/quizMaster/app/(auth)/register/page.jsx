"use client";

import React, { useState, useActionState } from "react";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import { useRef } from "react";
import RegisterForm from "../../features/auth/components/RegisterForm";
import ClientOnly from "../../features/auth/components/ClientOnly";

const Register = () => {
  return (
    <ClientOnly>
      <div
        className="flex flex-col min-h-[80vh] justify-center items-center"
        suppressHydrationWarning
      >
        <h3 className="text-3xl font-bold text-primary pb-6">Register Form </h3>
        <RegisterForm />
      </div>
    </ClientOnly>
  );
};

export default Register;
