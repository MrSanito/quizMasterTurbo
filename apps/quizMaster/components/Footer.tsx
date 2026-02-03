"use client";

import React from "react";
import Link from "next/link";
import { 
  FaTwitter, 
  FaGithub, 
  FaDiscord, 
  FaLinkedinIn 
} from "react-icons/fa6";
import { motion } from "framer-motion";

const Footer = () => {
    const socialLinks = [
        { icon: FaTwitter, href: "#" },
        { icon: FaGithub, href: "#" },
        { icon: FaDiscord, href: "#" },
        { icon: FaLinkedinIn, href: "#" },
    ];

  return (
    <footer className="bg-base-200 text-base-content border-t border-base-300">
      <div className="container mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary tracking-tight">
              QuizMaster
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Elevate your knowledge with the ultimate quiz experience. Compete, learn, and grow with our community.
            </p>
             <div className="flex gap-4 pt-2">
              {socialLinks.map((social, idx) => {
                  const Icon = social.icon;
                  return (
                    <motion.a 
                        key={idx}
                        href={social.href} 
                        whileHover={{ y: -3, color: "var(--color-primary)" }}
                        className="text-gray-400 hover:text-primary transition-colors duration-200"
                    >
                        <Icon size={20} />
                    </motion.a>
                  )
              })}
             </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6 text-gray-900 dark:text-gray-100">Platform</h3>
            <ul className="space-y-3 font-medium text-gray-500 text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/quiz/mode" className="hover:text-primary transition-colors">Play Quiz</Link></li>
              <li><Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6 text-gray-900 dark:text-gray-100">Company</h3>
             <ul className="space-y-3 font-medium text-gray-500 text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6 text-gray-900 dark:text-gray-100">Stay Updated</h3>
            <p className="text-sm text-gray-500 mb-4">
                Subscribe to our newsletter for the latest updates and challenges.
            </p>
            <div className="flex flex-col gap-3">
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="input input-bordered w-full input-sm focus:border-primary focus:outline-none" 
                />
                <button className="btn btn-primary btn-sm w-full">Subscribe</button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-base-300 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} QuizMaster. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
