import { useFloating, useTransitionStyles } from "@floating-ui/react";
import { autoUpdate } from "@floating-ui/react-dom";
import { useEffect, useState } from "react";
import { tv } from "tailwind-variants";

import { Icons } from "../enums";
import { useRemoveNotification } from "../hooks";
import type { UINotificationType } from "../types";
import { variantToHex } from "../utils";
import { Button } from "./Button";
import { Icon } from "./Icon";

const classes = tv({
  slots: {
    base: "border-primary dark:bg-primary dark:border-secondary relative z-62 flex h-fit w-96 flex-col gap-y-1 rounded-md border bg-white px-1 shadow-lg transition-all",
    titleContainer:
      "flex items-center border-b border-gray-300 pt-2 pb-2 font-medium",
    progressBar: "absolute top-0 left-0 h-1 w-full rounded-t-md transition-all",
    titleClasses: "flex items-center gap-x-2 overflow-hidden pl-1",
    titleText: "line-clamp-2 flex-1",
    mainActions: "ml-auto flex min-w-fit",
    descriptionContainer: "line-clamp-5 min-h-fit px-2 pb-2 text-sm",
  },
  variants: {
    isExpanded: {
      false: {
        titleContainer: "border-b-0",
      },
    },
    variant: {
      primary: {
        progressBar: "bg-primary",
      },
      secondary: {
        progressBar: "bg-secondary",
      },
      info: {
        progressBar: "bg-info",
      },
      success: {
        progressBar: "bg-success",
      },
      warning: {
        progressBar: "bg-warning",
      },
      error: {
        progressBar: "bg-error",
      },
    },
  },
});

export function Notification({
  id,
  variant = "info",
  title,
  icon,
  timer = 10,
}: UINotificationType) {
  const [isOpen, setIsOpen] = useState(true);
  const [progress, setProgress] = useState(1);
  const {
    base,
    titleContainer,
    progressBar,
    titleClasses,
    titleText,
    mainActions,
  } = classes({
    variant,
  });
  //   const removeNotification = useRemoveNotification();
  const { refs, context } = useFloating({
    transform: true,
    placement: "right",
    open: isOpen,
    whileElementsMounted: autoUpdate,
  });
  const removeNotification = useRemoveNotification();
  useEffect(() => {
    const progressTimeout = setTimeout(() => {
      if (progress === 1) setProgress(0);
    }, 25);
    const hideTimeout = setTimeout(() => {
      setIsOpen(false);
    }, timer * 1000);

    const removeTimeout = setTimeout(
      () => {
        removeNotification(id);
      },
      timer * 1000 + 550
    );

    return () => {
      clearTimeout(progressTimeout);
      clearTimeout(hideTimeout);
      clearTimeout(removeTimeout);
    };
  }, [progress]);

  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      transform: "translateX(500px)",
    },
    common: {
      transitionDuration: "500ms",
    },
  });

  if (!isMounted) return null;
  return (
    <div ref={refs.setFloating} className={base()} style={styles}>
      <div
        className={progressBar()}
        style={{
          width: `${progress === 1 ? 100 : 0}%`,
          transition: `width ${timer}s linear`,
        }}
      />
      <h4 className={titleContainer()}>
        <span className={titleClasses()}>
          {icon ? (
            <Icon color={variantToHex(variant)} fontSize={24} icon={icon} />
          ) : null}
          <p className={titleText()}>{title}</p>
        </span>
        <span className={mainActions()}>
          <span>
            <Button
              hasNoBorder
              icon={Icons.close}
              isOutline
              onClick={() => removeNotification(id)}
              size="sm"
              variant="secondary"
            />
          </span>
        </span>
      </h4>
    </div>
  );
}
