
import React from "react";
import { cn } from "@/lib/utils";

interface GlassMorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "heavy";
  hasHoverEffect?: boolean;
  hasBorder?: boolean;
}

const GlassMorphicCard = ({ 
  children, 
  className, 
  intensity = "medium", 
  hasHoverEffect = false, 
  hasBorder = true,
  ...props 
}: GlassMorphicCardProps) => {
  const intensityClasses = {
    light: "bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm",
    medium: "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md",
    heavy: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg"
  };

  const borderClass = hasBorder ? "border border-white/20 dark:border-gray-800/30" : "";
  const hoverClass = hasHoverEffect ? "transition-all duration-300 hover:shadow-medium hover:scale-[1.01]" : "";

  return (
    <div
      className={cn(
        intensityClasses[intensity],
        borderClass,
        hoverClass,
        "rounded-lg shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassMorphicCard;
