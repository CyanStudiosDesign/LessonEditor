import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'
import { ChevronRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'
import { useAccordionItem } from '@/components/ui/accordion/AccordionItem'
import { cn } from '@/lib/utils'

/**
 * Cyan UI TreeView, adapted for LessonEditor.
 *
 * Upstream renders a static folder listing from `label` strings. A curriculum
 * tree also has to carry per-row icons, counts, badges, hover actions, a
 * selected state and drag handles, and its open/closed state has to live in the
 * app store so it survives a reload — so rows here take nodes instead of text
 * and the accordion is driven in controlled mode.
 *
 * Kept from upstream: the composable TreeView / TreeFolder / TreeItem shape,
 * the level-context indentation, the accordion-backed folder state, and the
 * `tree-view*` class hooks the connector lines are drawn with.
 */

type TreeLevelContextValue = { level: number }

const TreeLevelContext = createContext<TreeLevelContextValue>({ level: 0 })

/** Row indent in px — editor density rather than docs density. */
const INDENT_STEP = 14
const INDENT_BASE = 6

function indentFor(level: number) {
  return level * INDENT_STEP + INDENT_BASE
}

export function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/* ------------------------------------------------------------------ *
 * Row
 * ------------------------------------------------------------------ */

interface TreeRowProps {
  /** Main content. A node rather than a string so rows can render inputs. */
  label: ReactNode
  icon?: ReactNode
  /** Counts and badges, pushed to the right of the label. */
  trailing?: ReactNode
  /** Hover-revealed controls, rendered outside the row button. */
  actions?: ReactNode
  /** Drag handle, rendered before the disclosure/icon. */
  leading?: ReactNode
  selected?: boolean
  muted?: boolean
  danger?: boolean
  title?: string
  onSelect?: () => void
  onDoubleClick?: () => void
  /** Replaces the label button entirely, e.g. while renaming. */
  replaceLabel?: ReactNode
}

interface RowShellProps extends TreeRowProps {
  level: number
  disclosure?: ReactNode
  className?: string
}

function RowShell({
  label,
  icon,
  trailing,
  actions,
  leading,
  selected,
  muted,
  danger,
  title,
  onSelect,
  onDoubleClick,
  replaceLabel,
  level,
  disclosure,
  className,
}: RowShellProps) {
  return (
    <div
      data-level={level}
      data-selected={selected ? 'true' : undefined}
      className={cn(
        'tree-view-row group/row relative flex h-7 items-center gap-1.5 rounded-md pr-1',
        'transition-colors duration-150',
        selected ? 'bg-accent-soft' : 'hover:bg-edge-soft',
        className,
      )}
      style={{ paddingLeft: indentFor(level) }}
    >
      {/* 2px selection rail, aligned to the row's own indent */}
      <span
        aria-hidden
        className={cn(
          'absolute top-1 bottom-1 left-0 w-[2px] rounded-full transition-opacity duration-150',
          selected ? 'bg-accent opacity-100' : 'opacity-0',
        )}
      />

      {leading}
      {/* Fixed-width slot so leaf rows stay indented past their parent's
          chevron instead of collapsing back level with it. */}
      <span className="flex h-[17px] w-[17px] shrink-0 items-center justify-center">
        {disclosure}
      </span>

      {replaceLabel ? (
        <>
          {icon}
          {replaceLabel}
        </>
      ) : (
        <button
          type="button"
          title={title}
          onClick={onSelect}
          onDoubleClick={onDoubleClick}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {icon}
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[13px]',
              danger ? 'text-danger italic' : muted ? 'text-ink-muted' : 'text-ink',
              selected && !danger && 'font-medium text-ink',
            )}
          >
            {label}
          </span>
          {trailing}
        </button>
      )}

      {actions ? (
        <div className="hidden shrink-0 items-center group-hover/row:flex">{actions}</div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Folder
 * ------------------------------------------------------------------ */

interface TreeFolderProps extends TreeRowProps {
  /** Accordion key. */
  id: string
  children: ReactNode
  /** Ref for the drop target wrapping this folder's children. */
  bodyRef?: Ref<HTMLDivElement>
  bodyClassName?: string
  /** Rendered inside the branch after the children, e.g. an "add" affordance. */
  footer?: ReactNode
}

export function TreeFolder({
  id,
  children,
  bodyRef,
  bodyClassName,
  footer,
  ...row
}: TreeFolderProps) {
  return (
    <AccordionItem value={id} className="border-b-0">
      <FolderBody
        bodyRef={bodyRef}
        bodyClassName={bodyClassName}
        footer={footer}
        row={row}
      >
        {children}
      </FolderBody>
    </AccordionItem>
  )
}

/** Split out so it can read the accordion item context created above it. */
function FolderBody({
  row,
  children,
  bodyRef,
  bodyClassName,
  footer,
}: {
  row: TreeRowProps
  children: ReactNode
  bodyRef?: Ref<HTMLDivElement>
  bodyClassName?: string
  footer?: ReactNode
}) {
  const { level } = useContext(TreeLevelContext)
  const { isOpen, toggleItem } = useAccordionItem()

  return (
    <>
      <RowShell
        {...row}
        level={level}
        disclosure={
          <button
            type="button"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            aria-expanded={isOpen}
            onClick={toggleItem}
            className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded text-ink-faint transition-colors duration-150 hover:text-ink"
          >
            <ChevronRight
              size={13}
              className={cn('transition-transform duration-150', isOpen && 'rotate-90')}
            />
          </button>
        }
      />

      <AccordionContent className="p-0 text-inherit">
        <TreeLevelContext value={{ level: level + 1 }}>
          <div
            ref={bodyRef}
            role="group"
            className={cn('tree-view-branch', bodyClassName)}
            style={
              { '--tree-guide-left': `${indentFor(level) + 7}px` } as CSSProperties
            }
          >
            {/* Children unmount while closed so collapsed rows cannot act as
                invisible drop targets. */}
            {isOpen ? children : null}
            {isOpen ? footer : null}
          </div>
        </TreeLevelContext>
      </AccordionContent>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Item (leaf)
 * ------------------------------------------------------------------ */

export function TreeItem({
  className,
  ...row
}: TreeRowProps & { className?: string }) {
  const { level } = useContext(TreeLevelContext)
  return <RowShell {...row} level={level} className={className} />
}

/* ------------------------------------------------------------------ *
 * Root
 * ------------------------------------------------------------------ */

interface TreeViewProps {
  /** Controlled list of open folder ids. */
  openIds: string[]
  onOpenIdsChange: (ids: string[]) => void
  className?: string
  children: ReactNode
}

export default function TreeView({
  openIds,
  onOpenIdsChange,
  className,
  children,
}: TreeViewProps) {
  return (
    <Accordion
      type="multiple"
      value={openIds}
      onValueChange={onOpenIdsChange}
      className={cn(
        'w-full overflow-visible rounded-none border-0 bg-transparent',
        className,
      )}
    >
      <div className="tree-view" role="tree">
        <TreeLevelContext value={{ level: 0 }}>{children}</TreeLevelContext>
      </div>
    </Accordion>
  )
}
