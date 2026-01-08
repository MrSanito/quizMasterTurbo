import React from "react";
import Link from "next/link";

const MaxTryReached = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-sm bg-base-100 border border-base-300 shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl">
        {/* Icon / Emoji */}
        <div className="pt-6 flex justify-center">
          <div className="h-14 w-14 rounded-full bg-error/10 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
        </div>

        <div className="card-body items-center text-center gap-3">
          <h2 className="card-title text-error text-lg sm:text-xl">
            Maximum Tries Reached
          </h2>

          <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
            Oops! You’ve used all your guest attempts. Log in to unlock
            unlimited quizzes and flex your brain 🧠💪
          </p>

          <div className="card-actions w-full flex flex-col justify-center sm:flex-row gap-2 pt-2">
            <Link href={`/login`} className="btn btn-primary w-full rounded-xl">
              <button>Login</button>
            </Link>
            <Link
              href={`/register`}
              className="btn btn-outline btn-secondary w-full rounded-xl"
            >
              <button>Register</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaxTryReached;
