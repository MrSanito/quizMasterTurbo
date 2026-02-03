"use client";
import Cta from "@/components/Cta";
import FeaturedSection from "@/components/FeaturedSection";
import HeroSection from "@/components/Hero";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import Hero from "daisyui/components/hero";
import Image from "next/image";
import Loading from "@/components/Loading";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, loading } = useUser();

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-30" />
      </div>

      <main className="flex-grow">
        <div className="space-y-0"> {/* Removed gap to let sections handle their own spacing nicely */}
          <HeroSection />
          <FeaturedSection />
          <HowItWorksSection />
          {/* Add CTA here if needed, consistent with imports */}
          {/* <Cta /> */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
