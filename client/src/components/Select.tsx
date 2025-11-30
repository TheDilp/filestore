import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from "@floating-ui/react";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";
import { tv } from "tailwind-variants";

import { Icons } from "../enums";
import type { BaseFormComponent, BaseFormEntryComponent } from "../types";
type Props = BaseFormComponent &
  BaseFormEntryComponent & {
    options: { id: string; label: string; value: string | number | null }[];
  };

const classes = tv({
  slots: {
    base: "flex h-10 max-h-10 min-h-10 w-full flex-1 cursor-pointer items-center justify-between gap-x-2 rounded-lg border dark:bg-primary bg-white px-2 outline-1 outline-transparent",
    labelClasses: "max-h-4 text-sm dark:text-secondary-highlight",
    container: "group flex flex-col gap-y-1",
    optionsContainer:
      "rounded-md border bg-white dark:bg-primary-highlight dark:text-white shadow outline-0",
  },
  variants: {
    variant: {
      primary: {
        base: "border-primary-highlight focus-within:outline-info-highlight",
        labelClasses: "text-primary-darkened group-focus-within:text-zinc-600",
        optionsContainer: "border-primary",
      },
      secondary: {
        base: "border-secondary focus-within:outline-info-highlight",
        labelClasses: "text-primary-highlight group-focus-within:text-primary",
        optionsContainer: "border-secondary",
      },
      info: {
        base: "border-info focus-within:outline-info-highlight",
        labelClasses: "text-info group-focus-within:text-info-highlight",
        optionsContainer: "border-info",
      },
      success: {
        base: "border-success focus-within:outline-success-highlight",
        labelClasses: "text-success group-focus-within:text-success-highlight",
        optionsContainer: "border-success",
      },
      warning: {
        base: "border-warning focus-within:outline-warning-highlight",
        labelClasses: "text-warning group-focus-within:text-warning-highlight",
        optionsContainer: "border-warning",
      },
      error: {
        base: "border-error focus-within:outline-error-highlight",
        labelClasses: "text-error group-focus-within:text-error-highlight",
        optionsContainer: "border-error",
      },
    },
  },
});

export function Select({
  title,
  name,
  onChange,
  value,
  options = [],
  variant = "primary",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { refs, floatingStyles, context } = useFloating<HTMLElement>({
    placement: "bottom-start",
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  const listRef = useRef<Array<HTMLElement | null>>([]);

  const click = useClick(context, { event: "mousedown" });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "listbox" });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    // This is a large list, allow looping.
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [dismiss, role, listNav, click]
  );

  const { base, labelClasses, container, optionsContainer } = classes({
    variant,
  });

  const selectedLabel =
    options.find((option) => option.value === value)?.label || null;

  return (
    <div className={container()}>
      {title ? <label className={labelClasses()}>{title}</label> : null}

      <div
        className={base()}
        ref={refs.setReference}
        {...getReferenceProps()}
        tabIndex={0}
      >
        <span className="font-medium">{selectedLabel || "Select"}</span>
        <Icon icon={Icons.arrowDown} fontSize={24} color="#a1a1aa" />
      </div>
      {isOpen ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              className={optionsContainer()}
              style={{
                ...floatingStyles,
                overflowY: "auto",
                minWidth: 100,
              }}
              {...getFloatingProps()}
            >
              {options.map((item, i) => (
                <div
                  key={item.id}
                  ref={(node) => {
                    listRef.current[i] = node;
                  }}
                  role="option"
                  className={`border-t-secondary cursor-pointer overflow-hidden border-t p-2 outline-0 transition-colors first:rounded-t-md first:border-t-0 last:rounded-b-md ${i === activeIndex || item?.value === value ? "bg-info-highlight/20 dark:bg-info-highlight text-info dark:text-white" : "text-black dark:text-white"}`}
                  tabIndex={i === activeIndex ? 0 : -1}
                  aria-selected={value === item?.value && i === activeIndex}
                  {...getItemProps({
                    // Handle pointer select.
                    onClick(e) {
                      e.preventDefault();
                      e.stopPropagation();

                      onChange({ name, value: item?.value });
                      //* If only single option select
                      setIsOpen(false);
                    },
                    // Handle keyboard select.
                    onKeyDown(event) {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onChange({ name, value: item?.value });
                        //* If only single option select
                        setIsOpen(false);
                      }
                    },
                  })}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
