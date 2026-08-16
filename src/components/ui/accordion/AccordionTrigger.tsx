"use client";

import { type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { useAccordionItem } from "./AccordionItem";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

type AccordionTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function AccordionTrigger({
  children,
  className,
  onClick,
  disabled,
  ...props
}: AccordionTriggerProps) {
  const { contentId, isOpen, toggleItem, triggerId } = useAccordionItem();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (!event.defaultPrevented && !disabled) {
      toggleItem();
    }
  }

  return (
    <button
      aria-controls={contentId}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-fg transition-colors hover:bg-subtle focus-ring-visible disabled:cursor-not-allowed disabled:text-fg-subtle",
        className,
      )}
      disabled={disabled}
      id={triggerId}
      onClick={handleClick}
      type="button"
      {...props}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md border border-border text-fg-muted",
          isOpen && "bg-canvas",
        )}
      >
        {isOpen ? (
          <Minus className="size-3.5" strokeWidth={2} />
        ) : (
          <Plus className="size-3.5" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
