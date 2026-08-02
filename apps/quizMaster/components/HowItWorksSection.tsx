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
        <section className="bg-[#100636] py-24 relative overflow-hidden text-white border-t border-[#5B32B4]/20">
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#5B32B4]/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Text Content */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="badge border-[#5B32B4] text-indigo-300 bg-[#340C97]/30 mb-4 p-4 font-semibold uppercase tracking-wide">
                        Hall of Fame
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
                        Rise to the Top <br/>
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Become a Legend.</span>
                    </h2>
                    <p className="text-lg text-slate-350 mb-8 leading-relaxed">
                        Every correct answer brings you closer to glory. Compete against the best minds worldwide and etch your name in the global leaderboard.
                        Can you beat the top score this week?
                    </p>
                    
                    <div className="flex gap-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-white">10k+</span>
                            <span className="text-sm text-slate-400">Active Players</span>
                        </div>
                        <div className="w-[1px] h-12 bg-[#5B32B4]/30"></div>
                        <div className="flex flex-col gap-1">
                             <span className="text-3xl font-bold text-white">50k+</span>
                            <span className="text-sm text-slate-400">Quizzes Taken</span>
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

                    <div className="bg-[#1b0654] rounded-3xl shadow-2xl border border-[#5B32B4]/30 overflow-hidden text-white">
                        <div className="p-6 border-b border-[#5B32B4]/30 flex justify-between items-center bg-[#150442]/50 backdrop-blur-md">
                            <h3 className="font-bold text-lg">Global Leaderboard</h3>
                            <button className="btn btn-xs btn-ghost text-indigo-400 hover:bg-white/5">View All</button>
                        </div>
                        <div className="p-2">
                            {topPlayers.map((player, index) => (
                                <div key={index} className="flex items-center justify-between p-3 hover:bg-[#340C97]/30 rounded-xl transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-full ${
                                            index === 0 ? "bg-yellow-500/25 text-yellow-300" :
                                            index === 1 ? "bg-slate-500/25 text-slate-300" :
                                            index === 2 ? "bg-orange-500/25 text-orange-400" : "text-slate-400"
                                        }`}>
                                            {index === 0 ? <Crown size={16} /> : `#${player.rank}`}
                                        </div>
                                        <div className="avatar">
                                            <div className="w-10 rounded-full border border-[#5B32B4]/30">
                                                <img src={player.avatar} alt={player.name} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-200">{player.name}</p>
                                            <p className="text-xs text-slate-400">Level {10 - index}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-400">{player.score.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
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