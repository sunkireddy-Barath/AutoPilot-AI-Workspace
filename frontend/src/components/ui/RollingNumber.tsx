'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

export default function RollingNumber({ value }: { value: number | string }) {
  const isNumber = typeof value === 'number'
  const target = isNumber ? (value as number) : 0
  
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  })

  useEffect(() => {
    if (isNumber) {
      motionValue.set(target)
    }
  }, [target, isNumber, motionValue])

  const displayValue = useTransform(springValue, (latest) => 
    Math.floor(latest).toLocaleString()
  )

  if (!isNumber) return <span>{value}</span>

  return <motion.span>{displayValue}</motion.span>
}
