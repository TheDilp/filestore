import {
  autoPlacement,
  autoUpdate,
  FloatingFocusManager,
  FloatingList,
  FloatingNode,
  FloatingPortal,
  FloatingTree,
  offset,
  safePolygon,
  size as floatingSize,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  useHover,
  useInteractions,
  useListItem,
  useListNavigation,
  useMergeRefs,
  useRole,
} from "@floating-ui/react";
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { tv } from "tailwind-variants";

import type { AvailableIcons } from "../enums";
import type { AllowedPlacements, Variant } from "../types";
import { Icon } from "./Icon";

type DropdownItemType = {
  id: string;
  allowedPlacements?: AllowedPlacements[];
  title?: string;
  child?: ReactNode;
  icon?: AvailableIcons;
  iconColor?: string;
  subItems?: DropdownItemType[];
  isDisabled?: boolean;
  isHidden?: boolean;
  onClick?: () => void;
  variant?: Variant;
  tooltip?: string;
};

type DropdownType = {
  allowedPlacements?: AllowedPlacements[];
  children?: ReactNode | null;
  items: DropdownItemType[];
  isDisabled?: boolean;
  event?: MouseEvent<HTMLDivElement, MouseEvent> | null;
};

const DropdownClasses = tv({
  slots: {
    base: "font-lato z-30 min-w-fit outline-none",
    floatingBase:
      "font-lato border-secondary absolute top-0 left-0 z-9999 overflow-y-auto rounded-md border shadow-lg",
  },
});
const DropdownItemClasses = tv({
  base: "group border-secondary py-2 font-medium text-primary text-sm group-hover:bg-secondary-highlight m-0 active:bg-secondary flex w-full cursor-pointer flex-nowrap items-center justify-center truncate border-b px-4 text-left outline-0 transition-colors last:border-0",
  variants: {
    variant: {
      primary: "bg-white text-primary",
      secondary: "bg-secondary text-primary-highlight",
      info: "bg-info",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
    },
    isDisabled: {
      true: "bg-disabled text-secondary active:bg-disabled active:text-secondary hover:bg-disabled hover:text-secondary cursor-not-allowed",
    },
    hasIcon: {
      true: "justify-between gap-x-2",
    },

    hasSubitems: {
      true: "",
      false: "",
    },
    isEvent: {
      true: "absolute",
    },
    isRoot: {
      true: "p-0",
      false: "",
    },
  },
});

function DropdownComponent({
  allowedPlacements = ["left", "right", "top", "bottom"],
  children,
  items,
  event,
  isDisabled,
}: DropdownType) {
  const { base, floatingBase } = DropdownClasses();

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const elementsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();

  const isNested = parentId !== null;

  const { floatingStyles, refs, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset({ mainAxis: 4, alignmentAxis: isNested ? -1 : 0 }),
      autoPlacement({ allowedPlacements }),
      floatingSize({
        apply({ elements, availableHeight }) {
          elements.floating.style.minWidth = `${elements.reference.getBoundingClientRect().width}px`;
          elements.floating.style.maxHeight = `${availableHeight}px`;
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: isNested && !isDisabled,
    delay: { open: 75 },
    handleClose: safePolygon({ blockPointerEvents: true }),
  });
  const click = useClick(context, {
    event: "mousedown",
    toggle: !isNested,
    ignoreMouse: isNested,
  });
  const role = useRole(context, { role: "menu" });
  const dismiss = useDismiss(context, { bubbles: true });
  const listNavigation = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    nested: isNested,
    onNavigate: setActiveIndex,
  });

  const tree = useFloatingTree();

  useEffect(() => {
    if (!tree) return () => {};

    function handleTreeClick() {
      setIsOpen(false);
    }

    function onSubMenuOpen(evt: { nodeId: string; parentId: string }) {
      if (evt.nodeId !== nodeId && evt.parentId === parentId) setIsOpen(false);
    }

    tree.events.on("click", handleTreeClick);
    tree.events.on("menuopen", onSubMenuOpen);

    return () => {
      tree.events.off("click", handleTreeClick);
      tree.events.off("menuopen", onSubMenuOpen);
    };
  }, [tree, nodeId, parentId]);

  useEffect(() => {
    if (isOpen && tree) tree.events.emit("menuopen", { parentId, nodeId });
  }, [tree, isOpen, nodeId, parentId]);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    role,
    dismiss,
    listNavigation,
  ]);
  const item = useListItem();
  const mergedRefs = useMergeRefs([refs.setReference, item.ref]);

  useEffect(() => {
    if (event) {
      refs.setPositionReference({
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            x: event.clientX,
            y: event.clientY,
            top: event.clientY,
            right: event.clientX,
            bottom: event.clientY,
            left: event.clientX,
          };
        },
      });
      setIsOpen(true);
    }
  }, [event]);
  if (items?.length === 0) return children;
  const dropdownItemClasses = DropdownItemClasses({
    isRoot: true,
    hasSubitems: !!items?.length,
  });
  const filteredItems = items.filter((dropdownItem) => !dropdownItem?.isHidden);
  return (
    <FloatingNode id={nodeId}>
      <div
        ref={mergedRefs}
        className={isNested ? dropdownItemClasses : base()}
        role={isNested ? "menuitem" : undefined}
        tabIndex={!isNested ? 0 : -1}
        {...getReferenceProps()}
      >
        {children || null}
      </div>
      {filteredItems.length ? (
        <FloatingList elementsRef={elementsRef}>
          {isOpen ? (
            <FloatingPortal>
              <FloatingFocusManager
                context={context}
                initialFocus={isNested ? -1 : 0}
                modal={false}
                returnFocus={!isNested}
              >
                <div
                  ref={refs.setFloating}
                  className={floatingBase()}
                  style={floatingStyles}
                  {...getFloatingProps()}
                >
                  {filteredItems && isOpen
                    ? filteredItems.map((dropdownItem) =>
                        dropdownItem.subItems?.length ? (
                          <Dropdown
                            key={dropdownItem.id}
                            allowedPlacements={
                              dropdownItem?.allowedPlacements ||
                              allowedPlacements
                            }
                            isDisabled={dropdownItem?.isDisabled}
                            items={dropdownItem.subItems}
                          >
                            <DropdownItem
                              allowedPlacements={
                                dropdownItem?.allowedPlacements ||
                                allowedPlacements
                              }
                              child={dropdownItem?.child}
                              icon={dropdownItem.icon}
                              iconColor={dropdownItem?.iconColor}
                              id={dropdownItem.id}
                              isDisabled={dropdownItem?.isDisabled}
                              onClick={
                                //* This is to apply disabled styles for the dropdown item
                                //* if there is no onclick for the button itself and no subitems
                                //* See bellow for dropdown item classes

                                dropdownItem?.onClick
                                  ? () => {
                                      if (dropdownItem?.isDisabled) return;
                                      if (dropdownItem?.onClick)
                                        dropdownItem.onClick();

                                      tree?.events.emit("click");
                                      setIsOpen(false);
                                    }
                                  : undefined
                              }
                              subItems={dropdownItem.subItems.filter(
                                (subItem) => !subItem.isHidden
                              )}
                              title={dropdownItem.title}
                              tooltip={dropdownItem?.tooltip}
                              variant={dropdownItem?.variant || "primary"}
                            />
                          </Dropdown>
                        ) : (
                          <DropdownItem
                            key={dropdownItem.id}
                            allowedPlacements={
                              dropdownItem?.allowedPlacements ||
                              allowedPlacements
                            }
                            child={dropdownItem?.child}
                            icon={dropdownItem.icon}
                            iconColor={dropdownItem?.iconColor}
                            id={dropdownItem.id}
                            isDisabled={dropdownItem?.isDisabled}
                            onClick={
                              //* This is to apply disabled styles for the dropdown item
                              //* if there is no onclick for the button itself and no subitems
                              //* See bellow for dropdown item classes
                              dropdownItem?.onClick
                                ? () => {
                                    if (dropdownItem?.isDisabled) return;
                                    if (dropdownItem?.onClick)
                                      dropdownItem.onClick();

                                    tree?.events.emit("click");
                                    setIsOpen(false);
                                  }
                                : undefined
                            }
                            subItems={dropdownItem.subItems}
                            title={dropdownItem.title}
                            tooltip={dropdownItem?.tooltip}
                            variant={dropdownItem?.variant || "primary"}
                          />
                        )
                      )
                    : null}
                </div>
              </FloatingFocusManager>
            </FloatingPortal>
          ) : null}
        </FloatingList>
      ) : null}
    </FloatingNode>
  );
}

function DropdownItem({
  title: label,
  icon,
  onClick,
  subItems,
  iconColor,
  isDisabled,

  child,
  variant = "primary",
}: DropdownItemType) {
  const dropdownItemClasses = DropdownItemClasses({
    isDisabled: isDisabled || (!onClick && !subItems?.length),
    hasSubitems: !!subItems?.length,
    hasIcon: !!icon,
    variant,
  });
  return (
    <div
      className={dropdownItemClasses}
      onClick={(e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (onClick) onClick();
      }}
      onKeyDown={() => {}}
      role="menuitem"
      tabIndex={0}
    >
      {icon ? (
        <div>
          <Icon color={iconColor} fontSize={20} icon={icon} />
        </div>
      ) : null}
      {label && !child ? (
        <div className="w-full truncate select-none">{label}</div>
      ) : null}
      {child ?? null}
    </div>
  );
}

export function Dropdown(props: DropdownType) {
  const parentId = useFloatingParentNodeId();

  if (parentId === null)
    return (
      <FloatingTree>
        <DropdownComponent {...props} />
      </FloatingTree>
    );

  return <DropdownComponent {...props} />;
}
