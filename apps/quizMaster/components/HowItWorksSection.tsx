"use client";

import { motion } from "framer-motion";
import { Trophy, Crown, Medal, TrendingUp } from "lucide-react";
import Image from "next/image";

// Mock Data for the leaderboard
const topPlayers = [
  { rank: 1, name: "Alex Johnson", score: 12450, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", trend: "up" },
  { rank: 2, name: "Sarah Williams", score: 11800, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", trend: "up" },
  { rank: 3, name: "Michael Chen", score: 10500, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael", trend: "down" },
  { rank: 4, name: "Jessica Smith", score: 9850, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica", trend: "same" },
  { rank: 5, name: "David Miller", score: 9200, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", trend: "up" },
];

const HowItWorksSection = () => {
    return (
        <section className="bg-base-100 py-24 relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Text Content */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="badge badge-primary badge-outline mb-4 p-4 font-semibold uppercase tracking-wide">
                        Hall of Fame
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                        Rise to the Top <br/>
                        <span className="text-primary">Become a Legend.</span>
                    </h2>
                    <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                        Every correct answer brings you closer to glory. Compete against the best minds worldwide and etch your name in the global leaderboard.
                        Can you beat the top score this week?
                    </p>
                    
                    <div className="flex gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">10k+</span>
                            <span className="text-sm text-gray-500">Active Players</span>
                        </div>
                        <div className="w-[1px] h-12 bg-base-300"></div>
                        <div className="flex flex-col gap-1">
                             <span className="text-3xl font-bold text-gray-900 dark:text-white">50k+</span>
                            <span className="text-sm text-gray-500">Quizzes Taken</span>
                        </div>
                    </div>
                </motion.div>

                {/* Leaderboard Card */}
                <motion.div
                     initial={{ opacity: 0, y: 50 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ duration: 0.7 }}
                     className="relative"
                >
                     {/* Decorative Elements */}
                     <Trophy className="absolute -top-8 -right-8 text-yellow-400 opacity-20 rotate-12" size={120} />

                    <div className="bg-white dark:bg-base-200 rounded-3xl shadow-2xl border border-base-200 overflow-hidden">
                        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-100/50 backdrop-blur-md">
                            <h3 className="font-bold text-lg">Global Leaderboard</h3>
                            <button className="btn btn-xs btn-ghost text-primary">View All</button>
                        </div>
                        <div className="p-2">
                            {topPlayers.map((player, index) => (
                                <div key={index} className="flex items-center justify-between p-3 hover:bg-base-100 rounded-xl transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-full ${
                                            index === 0 ? "bg-yellow-100 text-yellow-600" :
                                            index === 1 ? "bg-gray-100 text-gray-500" :
                                            index === 2 ? "bg-orange-100 text-orange-600" : "text-gray-400"
                                        }`}>
                                            {index === 0 ? <Crown size={16} /> : `#${player.rank}`}
                                        </div>
                                        <div className="avatar">
                                            <div className="w-10 rounded-full border border-base-300">
                                                <img src={player.avatar} alt={player.name} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{player.name}</p>
                                            <p className="text-xs text-gray-500">Level {10 - index}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{player.score.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                                            XP
                                            {player.trend === 'up' && <TrendingUp size={10} className="text-green-500" />}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorksSection;