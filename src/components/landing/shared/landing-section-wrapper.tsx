"use client"

import { type ReactNode } from "react"
import { type Variants, motion, useReducedMotion } from "framer-motion"

interface LandingSectionWrapperProps {
  children: ReactNode
  className?: string
  id?: string
}

const sectionVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
}

export function LandingSectionWrapper({
  children,
  className,
  id,
}: LandingSectionWrapperProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    )
  }

  return (
    <motion.section
      id={id}
      className={className}
      variants={sectionVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.section>
  )
}
