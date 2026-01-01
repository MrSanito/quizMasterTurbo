import Link from "next/link";

export default function NotAllowedPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-500">Access Denied 🚫</h1>

        <p className="mt-3 text-gray-400">
          You’ve reached the free quiz limit. Login to continue your journey 🚀
        </p>

        <Link
          href="/register"
          className="inline-block mt-5 mr-3 rounded bg-blue-600 px-5 py-2 text-white"
        >
          Register
        </Link>
        <Link
          href="/login"
          className="inline-block mt-5 rounded bg-blue-600 px-5 py-2 text-white"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
