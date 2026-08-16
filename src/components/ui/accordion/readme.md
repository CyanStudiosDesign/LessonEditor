# Accordion

A simple accordion component for showing collapsible content sections. It supports opening one item at a time or multiple items at the same time.

## Import

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordian";
```

## Basic Usage

```tsx
<Accordion type="single" defaultValue="shipping">
  <AccordionItem value="shipping">
    <AccordionTrigger>How does shipping work?</AccordionTrigger>
    <AccordionContent>
      Orders are packed within 24 hours and tracking details are shared by email.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="returns">
    <AccordionTrigger>Can I return my order?</AccordionTrigger>
    <AccordionContent>
      Yes. You can return unused items within 30 days of delivery.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## Multiple Open Items

Use `type="multiple"` when you want users to open more than one item at a time.

```tsx
<Accordion type="multiple" defaultValue={["shipping", "returns"]}>
  <AccordionItem value="shipping">
    <AccordionTrigger>How does shipping work?</AccordionTrigger>
    <AccordionContent>
      Orders are packed within 24 hours and tracking details are shared by email.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="returns">
    <AccordionTrigger>Can I return my order?</AccordionTrigger>
    <AccordionContent>
      Yes. You can return unused items within 30 days of delivery.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="support">
    <AccordionTrigger>How do I contact support?</AccordionTrigger>
    <AccordionContent>
      You can reach support from your account page.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## Props

## Accordion

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | Required | The accordion items to render. |
| `type` | `"single" \| "multiple"` | `"single"` | Controls whether one item or multiple items can be open at the same time. |
| `defaultValue` | `string \| string[]` | `undefined` | The item or items open by default. Use a string for `single`, and an array of strings for `multiple`. |
| `className` | `string` | `undefined` | Adds custom classes to the accordion wrapper. |

## AccordionItem

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | Required | The trigger and content for this item. |
| `value` | `string` | Required | Unique value used to identify this item. Must match `defaultValue` if it should open by default. |
| `className` | `string` | `undefined` | Adds custom classes to the item wrapper. |

## AccordionTrigger

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | Required | The clickable title/header for the accordion item. |
| `className` | `string` | `undefined` | Adds custom classes to the trigger button. |
| `disabled` | `boolean` | `false` | Disables the trigger button. |

`AccordionTrigger` also accepts normal button props like `id`, `aria-label`, `onClick`, and `type`.

## AccordionContent

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | Required | The collapsible content shown when the item is open. |
| `className` | `string` | `undefined` | Adds custom classes to the content area. |

`AccordionContent` also accepts normal `div` props.

## Single vs Multiple

Use `single` when only one section should be open at a time.

```tsx
<Accordion type="single" defaultValue="shipping">
```

Use `multiple` when users should be able to open several sections together.

```tsx
<Accordion type="multiple" defaultValue={["shipping", "returns"]}>
```

## Styling

The accordion uses the design tokens from `globals.css`, such as:

- `bg-surface`
- `border-border`
- `text-fg`
- `text-fg-muted`
- `focus-ring-visible`

You can customize the look by passing `className` to `Accordion`, `AccordionItem`, `AccordionTrigger`, or `AccordionContent`.

```tsx
<Accordion className="max-w-xl">
  <AccordionItem value="faq-1">
    <AccordionTrigger className="text-primary">
      Can I customize this?
    </AccordionTrigger>
    <AccordionContent className="text-fg">
      Yes. Use className props to adjust the styling.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## Notes

- Each `AccordionItem` must have a unique `value`.
- `AccordionTrigger` and `AccordionContent` must be placed inside `AccordionItem`.
- `AccordionItem` must be placed inside `Accordion`.
- For `type="single"`, `defaultValue` should be a string.
- For `type="multiple"`, `defaultValue` should be an array of strings.