import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "./(auth)/context/GetUserContext";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata = {
  title: "QuizMaster - Test Your Knowledge",
  description:
    "An interactive quiz platform to test your knowledge across various categories",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`
          antialiased bg-base-100 text-white min-h-screen`}
      >
        {/* <ClerkProvider> */}
          <UserProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </UserProvider>
        {/* </ClerkProvider> */}
      </body>
    </html>
  );
}
