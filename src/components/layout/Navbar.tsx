"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
    { name: "Home", href: "/" },
    { name: "CV", href: "/cv" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Progetti", href: "/progetti" },
    { name: "Shop", href: "/ecommerce" },
];

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4"
        >
            <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between gap-8 md:gap-12 min-w-[300px] md:min-w-fit">
                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-white/80 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                {/* Logo / Brand */}
                <Link href="/" className="font-heading font-bold text-xl tracking-tighter hover:text-primary transition-colors">
                    BOBU
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-white relative",
                                    isActive ? "text-white" : "text-white/60"
                                )}
                            >
                                {item.name}
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-20 left-4 right-4 glass-card rounded-2xl p-6 flex flex-col gap-4 md:hidden"
                >
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "text-lg font-medium transition-colors hover:text-white",
                                    isActive ? "text-primary" : "text-white/60"
                                )}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </motion.div>
            )}
        </motion.nav>
    );
}
