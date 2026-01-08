"use client";

import { motion } from "framer-motion";
import { Trophy, Flame, Target, Users, Gamepad2 } from "lucide-react";

const features = [
  {
    title: "Leaderboard Battles",
    description: "Compete with players and climb the global rankings.",
    icon: Trophy,
  },
  {
    title: "Daily Quiz Streaks",
    description: "New quizzes every day to keep your streak alive.",
    icon: Flame,
  },
  {
    title: "Skill Challenges",
    description: "Short challenges designed to sharpen your brain.",
    icon: Target,
  },
  {
    title: "Make Friends",
    description: "Add friends, compare scores, and challenge them.",
    icon: Users,
  },
  {
    title: "Multiplayer Mode",
    description: "Play real-time quiz battles with friends or others.",
    icon: Gamepad2,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5 },
  }),
};

const FeaturedSection = () => {
  return (
    <section className="bg-base-100 py-20">
      <div className="container mx-auto px-6 md:px-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            More Than Just Quizzes
          </h2>
          <p className="text-gray-600 text-lg">
            Learn solo, compete socially, and play together in real time.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="bg-base-100 border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-primary" />
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
