"use client";

import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Users, Globe, BrainCircuit } from "lucide-react";
import Image from "next/image";

const features = [
  {
    title: "Real-Time Multiplayer",
    description: "Challenge friends or match with random players globally in intense live battles.",
    icon: Users,
    className: "md:col-span-2 md:row-span-2",
    bg: "bg-gradient-to-br from-primary/10 to-primary/5",
    img: "/multiplayer-mock.png" // Placeholder logic
  },
  {
    title: "Global Leaderboards",
    description: "Climb the ranks and earn your spot in the Hall of Fame.",
    icon: Trophy,
    className: "md:col-span-1 md:row-span-1",
    bg: "bg-base-100"
  },
  {
    title: "Daily Streak",
    description: "Keep the fire alive with fresh quizzes every day.",
    icon: Flame,
    className: "md:col-span-1 md:row-span-1",
    bg: "bg-orange-500/10 text-orange-600"
  },
  {
    title: "Skill Categories",
    description: "Master Science, History, Tech, and more.",
    icon: BrainCircuit,
    className: "md:col-span-1 md:row-span-1",
    bg: "bg-base-100"
  },
  {
    title: "Instant Matches",
    description: "Jump into a game in seconds with our smart matchmaking.",
    icon: Zap,
    className: "md:col-span-2 md:row-span-1",
    bg: "bg-secondary/10"
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const FeaturedSection = () => {
  return (
    <section className="bg-base-100 py-24">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4 tracking-tight">
              Everything You Need to Win
            </h2>
            <p className="text-gray-500 text-lg">
              Packed with features to keep you engaged, learning, and competing at the highest level.
            </p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                variants={item}
                whileHover={{ scale: 1.02 }}
                className={`group relative overflow-hidden rounded-3xl border border-base-200 p-8 hover:shadow-xl transition-all duration-300 ${feature.className} ${feature.bg}`}
              >
                 <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-primary">
                          <Icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">{feature.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                    </div>
                </div>
                
                {/* Decorative gradients */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-current opacity-5 rounded-full blur-3xl group-hover:block hidden" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedSection;
