"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import { useAccordionItem } from "./AccordionItem";
import { cn } from "@/lib/utils";

type AccordionContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function AccordionContent({
  children,
  className,
  ...props
}: AccordionContentProps) {
  const { contentId, isOpen, triggerId } = useAccordionItem();

  return (
    <div
      aria-labelledby={triggerId}
      className={cn(
        "grid transition-all duration-200 ease-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}
      id={contentId}
      role="region"
      {...props}
    >
      <div className="overflow-hidden">
        <div className={cn("px-4 pb-4 pt-1 text-sm leading-normal text-fg-muted", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}