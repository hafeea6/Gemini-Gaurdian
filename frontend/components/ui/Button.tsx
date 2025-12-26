// =============================================================================
// GEMINI GUARDIAN - BUTTON COMPONENT
// =============================================================================
// Reusable button component with variants for different use cases.
// =============================================================================

import { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Props for the Button component.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: "primary" | "secondary" | "danger" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether button is loading */
  loading?: boolean;
  /** Icon to show before text */
  icon?: ReactNode;
  /** Children */
  children: ReactNode;
}

/**
 * Variant styles mapping.
 */
const variantStyles = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-700 hover:bg-gray-600 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "bg-transparent hover:bg-gray-700 text-gray-300"
};

/**
 * Size styles mapping.
 */
const sizeStyles = {
  sm: "py-1 px-3 text-sm",
  md: "py-2 px-4 text-base",
  lg: "py-3 px-6 text-lg",
  xl: "py-4 px-8 text-xl"
};

/**
 * Button component with variants.
 *
 * @param props - Component props
 * @returns JSX element
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
