// =============================================================================
// GEMINI GUARDIAN - LOADING SPINNER COMPONENT
// =============================================================================
// Reusable loading spinner with customizable size and color.
// =============================================================================

/**
 * Props for the Spinner component.
 */
interface SpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color class */
  color?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size mappings for spinner.
 */
const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
  xl: "w-12 h-12 border-4"
};

/**
 * Spinner component for loading states.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function Spinner({
  size = "md",
  color = "border-blue-500",
  className = ""
}: SpinnerProps) {
  return (
    <div
      className={`
        ${sizeMap[size]}
        ${color}
        border-t-transparent
        rounded-full
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}
