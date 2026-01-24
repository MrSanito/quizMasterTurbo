// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { UserProvider } from "./(auth)/context/GetUserContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


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
        <UserProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
            <ToastContainer
              position="bottom-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="dark"
              toastStyle={{
                width: "260px", // 👈 fixed width = predictable
                maxWidth: "260px",
                whiteSpace: "nowrap", // 👈 single line
                overflow: "hidden",
                textOverflow: "ellipsis",
                borderRadius: "14px",
              }}
            />
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
