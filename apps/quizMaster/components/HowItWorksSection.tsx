"use client";

import { motion } from "framer-motion";
import { PlayCircle, Users, Trophy } from "lucide-react";

const steps = [
  {
    title: "Choose a Quiz",
    description: "Pick a category and difficulty that fits your mood.",
    icon: PlayCircle,
  },
  {
    title: "Play Solo or Multiplayer",
    description: "Battle friends or random players in real time.",
    icon: Users,
  },
  {
    title: "Win, Rank & Improve",
    description: "Earn points, climb leaderboards, and level up.",
    icon: Trophy,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const HowItWorksTimeline = () => {
  return (
    <section className="bg-base-200 py-24">
      <div className="container mx-auto px-6 md:px-12">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Follow the journey from first quiz to leaderboard glory.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 h-full w-[2px] bg-primary/20 -translate-x-1/2" />

          {/* Steps */}
          <div className="space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={index}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className={`relative flex items-center ${
                    isLeft ? "justify-start" : "justify-end"
                  }`}
                >
                  {/* Card */}
                  <div
                    className={`w-full md:w-[420px] bg-base-100 border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all ${
                      isLeft ? "md:mr-auto" : "md:ml-auto"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon size={22} className="text-primary" />
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-base-200" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksTimeline;