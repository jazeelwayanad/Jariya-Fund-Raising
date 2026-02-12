"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface Slide {
    id: string
    title: string | null
    description: string | null
    imageUrl: string
    link: string | null
    order: number
}

export default function Slideshow() {
    const [slides, setSlides] = useState<Slide[]>([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await fetch("/api/slides")
                if (res.ok) {
                    const data = await res.json()
                    setSlides(data)
                }
            } catch (error) {
                console.error("Failed to fetch slides", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSlides()
    }, [])

    useEffect(() => {
        if (slides.length <= 1) return

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [slides.length, currentSlide])

    if (loading) return null
    if (slides.length === 0) return null

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Slide Container - Fixed 248px height */}
            <div className="relative w-full h-[248px] overflow-hidden rounded-[2.5rem] shadow-xl bg-gray-100 dark:bg-gray-900">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        <img
                            src={slides[currentSlide].imageUrl}
                            alt={slides[currentSlide].title || "Slide"}
                            className="w-full h-full object-cover"
                        />

                        {/* Gradient Overlay - Only show if there is text */}
                        {(slides[currentSlide].title || slides[currentSlide].description) && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-start p-6 md:p-10">
                                <div className="text-white max-w-2xl">
                                    {slides[currentSlide].title && (
                                        <h2 className="text-xl md:text-3xl font-bold mb-2 drop-shadow-md">
                                            {slides[currentSlide].title}
                                        </h2>
                                    )}
                                    {slides[currentSlide].description && (
                                        <p className="text-sm md:text-base opacity-90 drop-shadow-sm mb-4">
                                            {slides[currentSlide].description}
                                        </p>
                                    )}
                                    {slides[currentSlide].link && (
                                        <Button asChild variant="secondary" className="bg-white text-black hover:bg-white/90">
                                            <a href={slides[currentSlide].link} target="_blank" rel="noopener noreferrer">
                                                Learn More
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pill Indicators - Outside the slide */}
            {slides.length > 1 && (
                <div className="flex gap-1.5">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === index
                                    ? "bg-[#851656] w-6"
                                    : "bg-[#FFE8A3] w-3 hover:bg-[#ffe8a3]/80"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
