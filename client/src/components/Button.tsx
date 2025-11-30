import { Icon } from "@iconify/react";
import type { MouseEventHandler } from "react";
import { tv } from "tailwind-variants";

import { type AvailableIcons, Icons } from "../enums";
import type { BaseFormComponent } from "../types";
type Props = BaseFormComponent & {
  icon?: AvailableIcons;
  iconPosition?: "left" | "right";
  iconSize?: number;
  isDisabled?: boolean;
  isLoading?: boolean;
  isOutline?: boolean;
  isFullWidth?: boolean;
  hasNoBorder?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement> | undefined;
};

const classes = tv({
  slots: {
    base: "flex h-10 max-h-10 cursor-pointer select-none items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 font-medium text-white transition-all focus:outline-2 active:scale-95 active:shadow-none",
    labelClasses: "",
    iconClasses: "text-lg dark:text-white",
  },
  variants: {
    variant: {
      primary:
        "bg-primary dark:bg-primary-highlight border-primary-darkened hover:bg-primary-highlight active:bg-gray-900",
      secondary:
        "bg-secondary border-secondary hover:bg-secondary-highlight text-white active:bg-gray-600",
      info: "bg-info border-info hover:bg-info-highlight active:bg-blue-600",
      success:
        "bg-success border-success hover:bg-success-highlight active:bg-green-600",
      warning:
        "border-warning bg-warning hover:bg-warning-highlight active:bg-orange-600",
      error: "border-error bg-error hover:bg-error-highlight active:bg-red-800",
    },
    size: {
      xs: {
        base: "h-6 max-h-6 text-xs",
        iconClasses: "text-base",
      },
      sm: { base: "h-7 max-h-7 text-sm", iconClasses: "text-lg" },
      md: { base: "h-8 max-h-8", iconClasses: "text-xl" },
      lg: { base: "h-9 max-h-9 text-lg", iconClasses: "text-2xl" },
      xl: { base: "h-10 max-h-10 text-xl", iconClasses: "text-3xl" },
    },
    isFullWidth: {
      true: "w-full",
      false: "w-fit",
    },
    isOutline: { true: "bg-transparent text-black", false: "" },
    isDisabled: {
      true: "bg-disabled active:bg-disabled hover:bg-disabled cursor-not-allowed border border-secondary text-gray-300 shadow-none transition-none active:scale-100 active:text-gray-300",
    },
    isLoading: {
      true: {
        iconClasses: "animate-spin text-info-highlight",
      },
    },
    hasNoBorder: {
      true: "border-0 shadow-none hover:bg-transparent active:bg-transparent",
      false: "",
    },
    hasIconOnly: {
      true: "p-2",
    },
  },
  compoundVariants: [
    {
      isOutline: true,
      isDisabled: true,
      className: {
        base: "hover:text-gray-900 active:text-gray-900",
      },
    },
    {
      isDisabled: true,
      hasIconOnly: true,
      className: {
        iconClasses: "text-gray-400",
      },
    },
    {
      isOutline: true,
      isDisabled: true,
      class: "bg-transparent",
    },
    {
      variant: "primary",
      isOutline: true,
      hasNoBorder: false,
      class: "text-gray-900 hover:text-white active:text-white",
    },
    {
      variant: "secondary",
      isOutline: true,
      hasNoBorder: false,
      class: "text-gray-600 hover:text-white active:text-white",
    },
    {
      variant: "info",
      isOutline: true,
      hasNoBorder: false,
      class: "text-blue-600 hover:text-white active:text-white",
    },
    {
      variant: "success",
      isOutline: true,
      hasNoBorder: false,
      class: "text-green-600 hover:text-white active:text-white",
    },
    {
      variant: "warning",
      isOutline: true,
      hasNoBorder: false,
      class: "text-orange-600 hover:text-white active:text-white",
    },
    {
      variant: "error",
      isOutline: true,
      hasNoBorder: false,
      class: "text-red-600 hover:text-white active:text-white",
    },
    {
      variant: "primary",
      isOutline: true,
      hasNoBorder: true,
      class: "text-gray-900",
    },
    {
      variant: "secondary",
      isOutline: true,
      hasNoBorder: true,
      class: "text-gray-600",
    },
    {
      variant: "info",
      isOutline: true,
      hasNoBorder: true,
      class: "text-blue-600",
    },
    {
      variant: "success",
      isOutline: true,
      hasNoBorder: true,
      class: "text-green-600",
    },
    {
      variant: "warning",
      isOutline: true,
      hasNoBorder: true,
      class: "text-orange-600",
    },
    {
      variant: "error",
      isOutline: true,
      hasNoBorder: true,
      class: "text-red-600",
    },
  ],
});

export function Button({
  title,
  icon,
  iconSize = 24,
  isDisabled,
  isFullWidth,
  isLoading,
  onClick,
  isOutline,
  hasNoBorder,
  iconPosition = "right",
  variant = "primary",
  size = "md",
}: Props) {
  const { base, iconClasses } = classes({
    variant,
    isDisabled: isDisabled || isLoading,
    isOutline,
    isFullWidth,
    isLoading,
    hasIconOnly: !title && !!icon,
    hasNoBorder,
    size,
  });
  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      title={title || ""}
      className={base()}
    >
      {icon && iconPosition === "left" ? (
        <Icon
          icon={isLoading ? Icons.loading : icon}
          fontSize={iconSize}
          className={iconClasses()}
        />
      ) : null}

      {title ? title : null}
      {icon && iconPosition === "right" ? (
        <Icon
          icon={isLoading ? Icons.loading : icon}
          fontSize={iconSize}
          className={iconClasses()}
        />
      ) : null}
    </button>
  );
}
