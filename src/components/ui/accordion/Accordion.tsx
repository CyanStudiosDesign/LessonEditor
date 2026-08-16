"use client";

import { createContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  type: AccordionType;
  openItems: string[];
  toggleItem: (value: string) => void;
};

export const AccordionContext = createContext<AccordionContextValue | null>(
  null
);

type AccordionProps = {
  children: ReactNode;
  type?: AccordionType;
  defaultValue?: string | string[];
  /**
   * Controlled open items. When provided the accordion stops holding its own
   * state and the owner decides what is open — needed when the open/closed
   * state has to live in an app store or survive a reload.
   */
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
};

export default function Accordion({
  children,
  type = "single",
  defaultValue,
  value,
  onValueChange,
  className,
}: AccordionProps) {
  const initialOpenItems = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
      ? [defaultValue]
      : [];

  const [uncontrolledItems, setUncontrolledItems] =
    useState<string[]>(initialOpenItems);

  const isControlled = value !== undefined;
  const openItems = isControlled ? value : uncontrolledItems;

  function toggleItem(itemValue: string) {
    const isOpen = openItems.includes(itemValue);

    const next =
      type === "multiple"
        ? isOpen
          ? openItems.filter((item) => item !== itemValue)
          : [...openItems, itemValue]
        : isOpen
          ? []
          : [itemValue];

    if (!isControlled) setUncontrolledItems(next);
    onValueChange?.(next);
  }

  return (
    <AccordionContext.Provider value={{ type, openItems, toggleItem }}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border border-border bg-surface",
          className
        )}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}