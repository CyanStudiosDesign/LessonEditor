"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useId,
  type HTMLAttributes,
} from "react";
import { AccordionContext } from "./Accordion";
import { cn } from "@/lib/utils";

type AccordionItemContextValue = {
  value: string;
  isOpen: boolean;
  triggerId: string;
  contentId: string;
  toggleItem: () => void;
};

export const AccordionItemContext =
  createContext<AccordionItemContextValue | null>(null);

export function useAccordionItem() {
  const context = useContext(AccordionItemContext);

  if (!context) {
    throw new Error(
      "AccordionTrigger and AccordionContent must be used inside AccordionItem."
    );
  }

  return context;
}

type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  value: string;
};

export default function AccordionItem({
  children,
  value,
  className,
  ...props
}: AccordionItemProps) {
  const accordion = useContext(AccordionContext);
  const id = useId();

  if (!accordion) {
    throw new Error("AccordionItem must be used inside Accordion.");
  }

  const { openItems, toggleItem } = accordion;
  const isOpen = openItems.includes(value);

  return (
    <AccordionItemContext.Provider
      value={{
        value,
        isOpen,
        triggerId: `${id}-trigger`,
        contentId: `${id}-content`,
        toggleItem: () => toggleItem(value),
      }}
    >
      <div
        className={cn("border-b border-border last:border-b-0", className)}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}