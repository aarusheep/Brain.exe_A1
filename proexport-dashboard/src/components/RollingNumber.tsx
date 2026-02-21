import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface RollingNumberProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    decimals?: number
}

export default function RollingNumber({ value, duration = 1.2, prefix = '', suffix = '', decimals = 0 }: RollingNumberProps) {
    const [display, setDisplay] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const inView = useInView(ref, { once: true })
    const frameRef = useRef<number | null>(null)

    useEffect(() => {
        if (!inView) return
        const start = performance.now()
        const animate = (now: number) => {
            const elapsed = (now - start) / 1000
            const progress = Math.min(elapsed / duration, 1)
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(parseFloat((eased * value).toFixed(decimals)))
            if (progress < 1) frameRef.current = requestAnimationFrame(animate)
        }
        frameRef.current = requestAnimationFrame(animate)
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
    }, [inView, value, duration, decimals])

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0, y: 5 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="tracking-tight"
        >
            {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}
        </motion.span>
    )
}
