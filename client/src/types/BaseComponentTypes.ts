import type { MouseEventHandler, ReactNode } from "react";

import type { AvailableIcons } from "../enums";

export type Variant =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error";

export type Size = "xs" | "sm" | "md" | "lg" | "xl";
export type BaseFormComponent = {
  title?: string;
  variant?: Variant;
  size?: Size;
};

export type BaseFormEntryComponent<T = string | number> = {
  name: string;
  onChange: (e: { name: string; value: T }) => void;
  isDisabled?: boolean;
  value: T | null;
  helperText?: string;
  errors?: ({ message: string } | undefined)[] | undefined | null;
};

export type BaseComponentActionType = {
  id: string;
  title?: string;
  variant?: Variant;
  // size?: Size;
  isDisabled?: boolean;
  icon?: AvailableIcons;
  iconColor?: string;
  // iconThickness?: IconThickness;
  className?: string;
  onClick: MouseEventHandler<HTMLButtonElement> | undefined;
  // items?: DropdownItemType[];
  // allowedPlacements?: Placement[];
  tooltip?: string | ReactNode;
  tooltipDelay?: { open?: number; close?: number } | number;
};

export type AllowedPlacements = "left" | "right" | "top" | "bottom";
