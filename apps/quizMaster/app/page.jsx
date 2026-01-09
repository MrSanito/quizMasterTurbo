"use client" 
import Cta from "@/components/Cta";
import FeaturedSection from "@/components/FeaturedSection.tsx";
import HeroSection from "@/components/Hero";
import {useUser} from "@/app/(auth)/context/GetUserContext"
import Hero from "daisyui/components/hero";
import Image from "next/image";
import Loading from "@/components/Loading"
import HowItWorksSection from "@/components/HowItWorksSection";


export default function Home() {
    const { user, loading } = useUser();

       if (loading) return (
        <Loading/>
       )


  return (
    <div>
      
      <HeroSection />
      <FeaturedSection />
       <HowItWorksSection/>
    </div>
  );
}
