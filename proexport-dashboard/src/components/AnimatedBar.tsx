import { useEffect, useRef } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'

interface AnimatedBarProps {
    percent: number
    color?: string
}

export default function AnimatedBar({ percent, color }: AnimatedBarProps) {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true })
    const controls = useAnimation()

    useEffect(() => {
        if (inView) {
            controls.start({
                width: `${percent}%`,
                transition: { duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] },
            })
        }
    }, [inView, percent, controls])

    return (
        <div
            ref={ref}
            className="h-2 rounded-full overflow-hidden"
            style={{ background: '#dbe3ec' }}
        >
            <motion.div
                className="h-full rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={controls}
                style={{
                    background: color ?? 'linear-gradient(to right, #2f3a45, #3a5f7d)',
                    /* glow on the fill bar */
                    boxShadow: '0 0 6px rgba(58,95,125,0.42)',
                }}
            >
                {/* Moving shine overlay — industrial reflection */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22) 48%, transparent 62%)',
                    }}
                    animate={{ x: ['-100%', '250%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
                />
            </motion.div>
        </div>
    )
}
