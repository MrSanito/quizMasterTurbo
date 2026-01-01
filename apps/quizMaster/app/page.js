import Cta from "@/components/Cta";
import FeaturedSection from "@/components/FeaturedSection";
import HeroSection from "@/components/Hero";
import Hero from "daisyui/components/hero";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedSection />
      <Cta />
      <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl w-1/2 mx-auto ">
        <div className="card-body text-primary">
          <h2 className="card-title">Gradient Card</h2>
          <p>This card has a smooth gradient background.</p>
        </div>
      </div>
    </div>
  );
}
