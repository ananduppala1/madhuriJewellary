import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ElementType, ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * `motion.create()` builds a new component each call, which would remount the
 * subtree on every render. Cache one motion component per element type.
 */
type MotionTagComponent = ElementType<Record<string, unknown>>;

const motionCache = new Map<ElementType, MotionTagComponent>();

function motionTag(as: ElementType): MotionTagComponent {
  let cached = motionCache.get(as);
  if (!cached) {
    cached = motion.create(as as never) as MotionTagComponent;
    motionCache.set(as, cached);
  }
  return cached;
}

export type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "fade";

const OFFSETS: Record<RevealDirection, { x?: number; y?: number; scale?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 32 },
  right: { x: -32 },
  scale: { scale: 0.94 },
  fade: {},
};

export function Reveal({
  children,
  as = "div",
  direction = "up",
  delay = 0,
  duration = 0.75,
  className,
  once = true,
}: {
  children: ReactNode;
  as?: ElementType;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  className?: string | undefined;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motionTag(as);

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      data-reveal=""
      className={className}
      initial={{ opacity: 0, ...OFFSETS[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, amount: 0.15, margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/** Staggers direct children. Pair with <RevealItem>. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string | undefined;
  stagger?: number;
  delay?: number;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motionTag(as);

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <MotionTag
      data-reveal=""
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -60px 0px" }}
    >
      {children}
    </MotionTag>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string | undefined;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motionTag(as);

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag data-reveal="" className={className} variants={itemVariants}>
      {children}
    </MotionTag>
  );
}
