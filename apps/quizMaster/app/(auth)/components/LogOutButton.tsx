import React from "react";
 import { logOut } from "@/app/features/auth/actions";


const LogOutButton = () => {
  return (
    <div>
      <button
        onClick={() => {
          logOut();
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default LogOutButton;
