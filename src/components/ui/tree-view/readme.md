# Tree View

A composable tree view component for displaying a custom folder-like structure using nested JSX tags.

The tree does not read or display the actual project folder structure. It renders exactly what you write using `TreeView`, `TreeFolder`, and `TreeItem`.

## Import

```tsx
import TreeView, {
  TreeFolder,
  TreeItem,
} from "@/components/ui/tree-view/TreeView";
```

## Usage

```tsx
export default function Example() {
  return (
    <TreeView
      label="my-app-2"
      defaultOpenIds={["my-app-2", "src", "components", "ui"]}
    >
      <TreeFolder label="src">
        <TreeFolder label="components">
          <TreeFolder label="ui">
            <TreeFolder label="tree-view">
              <TreeItem label="TreeView.tsx" />
              <TreeItem label="readme.md" />
            </TreeFolder>

            <TreeFolder label="accordion">
              <TreeItem label="Accordion.tsx" />
              <TreeItem label="AccordionItem.tsx" />
              <TreeItem label="AccordionTrigger.tsx" />
              <TreeItem label="AccordionContent.tsx" />
            </TreeFolder>
          </TreeFolder>
        </TreeFolder>

        <TreeFolder label="app">
          <TreeItem label="layout.tsx" />
          <TreeItem label="page.tsx" />
          <TreeItem label="globals.css" />
        </TreeFolder>
      </TreeFolder>

      <TreeFolder label="public">
        <TreeItem label="studio.jpg" />
      </TreeFolder>

      <TreeItem label="package.json" />
      <TreeItem label="next.config.ts" />
      <TreeItem label="README.md" />
    </TreeView>
  );
}
```

## API

### TreeView

Root wrapper for the tree.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `undefined` | Optional root folder label. |
| `id` | `string` | Generated from label | Custom ID for the root folder. Useful for `defaultOpenIds`. |
| `defaultOpenIds` | `string[]` | `[]` | Folder IDs that should be open by default. |
| `className` | `string` | `undefined` | Additional classes for the tree wrapper. |
| `children` | `ReactNode` | Required | Nested `TreeFolder` and `TreeItem` elements. |

### TreeFolder

Creates an expandable folder row.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | Required | Folder name shown in the tree. |
| `id` | `string` | Generated from label | Custom folder ID. Useful for `defaultOpenIds`. |
| `children` | `ReactNode` | Required | Nested folders or items. |

### TreeItem

Creates a file/item row.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | Required | Item name shown in the tree. |

## Default Open Folders

Folders can be opened by default using `defaultOpenIds`.

If no custom `id` is provided, the ID is generated from the folder label:

```tsx
<TreeView defaultOpenIds={["src", "components"]}>
  <TreeFolder label="src">
    <TreeFolder label="components">
      <TreeItem label="Button.tsx" />
    </TreeFolder>
  </TreeFolder>
</TreeView>
```

For more control, pass your own IDs:

```tsx
<TreeView defaultOpenIds={["root", "source-folder"]}>
  <TreeFolder label="Project" id="root">
    <TreeFolder label="Source" id="source-folder">
      <TreeItem label="index.tsx" />
    </TreeFolder>
  </TreeFolder>
</TreeView>
```

## Styling

The tree view uses global theme tokens from `globals.css`.

Connector lines are styled through tree-specific classes:

```css
@layer components {
  .tree-view {
    --tree-line-color: color-mix(
      in oklch,
      var(--color-fg-subtle) 70%,
      var(--color-border)
    );
  }

  .tree-view-branch {
    position: relative;
  }

  .tree-view-branch::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 12px;
    width: 1px;
    background: var(--tree-line-color);
  }

  .tree-view-row {
    position: relative;
  }

  .tree-view-row[data-level="0"]::before {
    display: none;
  }

  .tree-view-row[data-level]:not([data-level="0"])::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 50%;
    width: 16px;
    height: 1px;
    background: var(--tree-line-color);
  }
}
```

To make the connector lines darker, increase the percentage:

```css
--tree-line-color: color-mix(
  in oklch,
  var(--color-fg-subtle) 90%,
  var(--color-border)
);
```

## Notes

- The tree structure is fully controlled by JSX nesting.
- It does not inspect real folders or files.
- Use `TreeFolder` for expandable folders.
- Use `TreeItem` for leaf items such as files, pages, or custom labels.
- Folder rows use the existing accordion component internally.