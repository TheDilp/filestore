import { Icon } from "@iconify/react";
import type { HTMLInputTypeAttribute, KeyboardEventHandler } from "react";
import { tv } from "tailwind-variants";

import { Icons } from "../enums";
import type { BaseFormComponent, BaseFormEntryComponent } from "../types";
type Props = BaseFormComponent &
  Omit<BaseFormEntryComponent<string | number>, "onChange"> & {
    placeholder?: string;
    type?: HTMLInputTypeAttribute;
    suffix?: string;
    min?: number;
    max?: number;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
    isAutofocused?: boolean;
    onChange: (e: {
      name: string;
      value: string | null;
      valueAsNumber?: number;
    }) => void;
  };

const classes = tv({
  slots: {
    base: "flex flex-1 items-center gap-x-2 overflow-hidden rounded-lg border bg-white outline-1 outline-transparent",
    labelClasses: "max-h-4 text-sm",
    container: "group flex flex-col gap-y-1",
    inputClasses: "h-10 max-h-10 min-h-10 w-full px-2 outline-0",
  },
  variants: {
    variant: {
      primary: {
        base: "border-primary focus-within:outline-info-highlight",
        labelClasses: "text-primary-highlight group-focus-within:text-zinc-600",
      },
      secondary: {
        base: "border-secondary focus-within:outline-info-highlight",
        labelClasses: "text-secondary group-focus-within:text-primary",
      },
      info: {
        base: "border-info focus-within:outline-info-highlight",
        labelClasses: "text-info group-focus-within:text-info-highlight",
      },
      success: {
        base: "border-success focus-within:outline-success-highlight",
        labelClasses: "text-success group-focus-within:text-success-highlight",
      },
      warning: {
        base: "border-warning focus-within:outline-warning-highlight",
        labelClasses: "text-warning group-focus-within:text-warning-highlight",
      },
      error: {
        base: "border-error focus-within:outline-error-highlight",
        labelClasses: "text-error group-focus-within:text-error-highlight",
      },
    },
  },
});

export function Input({
  title,
  name,
  placeholder,
  onChange,
  onKeyDown,
  value,
  type = "text",
  variant = "primary",
  errors = [],
  suffix,
  isAutofocused,
  min,
  max,
}: Props) {
  const { base, container, labelClasses, inputClasses } = classes({ variant });
  return (
    <div className={container()}>
      {title ? <label className={labelClasses()}>{title}</label> : null}
      <div className={base()}>
        {type === "search" ? (
          <Icon
            fontSize={20}
            className="ml-2 text-zinc-400"
            icon={Icons.search}
          />
        ) : null}
        <input
          onKeyDown={onKeyDown}
          name={name}
          autoFocus={isAutofocused}
          onChange={(e) =>
            onChange({
              name: e?.currentTarget?.name,
              value: e.currentTarget.value,
              valueAsNumber: e.currentTarget.valueAsNumber,
            })
          }
          className={inputClasses()}
          placeholder={placeholder}
          type={type}
          min={min}
          max={max}
          value={value || ""}
        />
        {suffix ? <span className="mr-2 text-zinc-600">{suffix}</span> : null}
      </div>
      {errors?.length ? (
        <span className="text-error text-xs">
          {errors
            .filter((e) => !!e?.message)
            .map((e) => e?.message)
            .join("\n")}
        </span>
      ) : null}
    </div>
  );
}
