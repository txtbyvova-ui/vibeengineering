import { motion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealTextProps {
  children: ReactNode;
  /** Stagger delay in seconds. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Wrapper element tag. */
  as?: "div" | "span" | "li";
  className?: string;
}

/**
 * Reusable mask-slide-up reveal. The child slides up from behind a clipping
 * mask when it enters the viewport. Pair multiple with incremental `delay`
 * to reveal text word-by-word or line-by-line.
 */
export default function RevealText({
  children,
  delay = 0,
  duration = 0.9,
  as = "div",
  className = "",
}: RevealTextProps) {
  const MotionTag = motion[as];
  return (
    <span className={`inline-block overflow-hidden align-bottom ${className}`}>
      <MotionTag
        initial={{ y: "110%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration, delay, ease: EASE }}
        className="inline-block"
      >
        {children}
      </MotionTag>
    </span>
  );
}
