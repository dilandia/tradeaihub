"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

type Props = {
  visible: boolean;
};

export function AiFloatingPill({ visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Link
            href="/ai-hub"
            className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/20 to-cyan-500/10 px-4 py-2.5 text-sm font-medium text-violet-600 shadow-lg shadow-violet-500/20 backdrop-blur-sm transition-all hover:scale-105 hover:border-violet-500/50 hover:shadow-violet-500/30 dark:text-violet-400"
          >
            <Sparkles className="h-4 w-4" />
            <span>Agentes IA</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
