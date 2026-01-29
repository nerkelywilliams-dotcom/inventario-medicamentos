"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16.5rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "4rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={{ "--sidebar-width": SIDEBAR_WIDTH, "--sidebar-width-icon": SIDEBAR_WIDTH_ICON, ...style } as React.CSSProperties}
          className={cn("group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-white", className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div className={cn("bg-[#1a2b4b] text-white flex h-full w-[var(--sidebar-width)] flex-col", className)} {...props}>
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-[#1a2b4b] text-white w-[var(--sidebar-width)] p-0 [&>button]:text-white [&>button]:opacity-70"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays mobile menu.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="group peer hidden md:block" data-state={state} data-collapsible={state === "collapsed" ? collapsible : ""} data-variant={variant} data-side={side} data-slot="sidebar">
      <div className={cn("relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-300 ease-in-out", "group-data-[collapsible=offcanvas]:w-0", "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]")} />
      <div className={cn("fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[width] duration-300 ease-in-out md:flex", side === "left" ? "left-0" : "right-0", "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]", className)} {...props}>
        <div data-sidebar="sidebar" data-slot="sidebar-inner" className="bg-[#1a2b4b] text-white flex h-full w-full flex-col shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 text-white/70 hover:text-white hover:bg-white/10", className)}
      onClick={(e) => { onClick?.(e); toggleSidebar() }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      data-sidebar="rail"
      onClick={toggleSidebar}
      className={cn("absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[1px] after:bg-white/5 hover:after:bg-white/20 sm:flex", className)}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("relative flex w-full flex-1 flex-col bg-white", className)} {...props} />
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return <Input className={cn("bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 w-full shadow-none focus-visible:ring-[#2b4cc4]", className)} {...props} />
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-6 mt-auto", className)} {...props} />
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator className={cn("bg-white/10 mx-6 w-auto", className)} {...props} />
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-1 flex-col gap-2 overflow-auto px-4 py-2", className)} {...props} />
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-slate-500 font-black text-[10px] mb-2 px-4 uppercase tracking-[0.2em] h-8 flex items-center", "group-data-[collapsible=icon]:opacity-0", className)} {...props} />
}

function SidebarGroupAction({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("text-white/50 hover:text-white absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md transition-colors", className)} {...props} />
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full text-sm", className)} {...props} />
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex w-full flex-col gap-1.5", className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("relative", className)} {...props} />
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-[1.3rem] p-3 text-left text-sm outline-hidden transition-all duration-300 group focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-[#2b4cc4] data-[active=true]:font-bold data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-blue-950/40 [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-slate-400 hover:bg-white/10 hover:text-white",
        outline: "bg-transparent border border-white/10 text-white hover:bg-white/5",
      },
      size: {
        default: "h-12 text-sm",
        sm: "h-9 text-xs",
        lg: "h-14 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()
  const button = <Comp data-active={isActive} className={cn(sidebarMenuButtonVariants({ variant, size }), className)} {...props} />

  if (!tooltip) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

function SidebarMenuAction({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("text-white/40 hover:text-white absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md transition-all", className)} {...props} />
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-white bg-[#2b4cc4] absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold", className)} {...props} />
}

function SidebarMenuSkeleton({ className, showIcon = false, ...props }: React.ComponentProps<"div"> & { showIcon?: boolean }) {
  return (
    <div className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)} {...props}>
      {showIcon && <Skeleton className="size-4 rounded-md bg-white/5" />}
      <Skeleton className="h-4 flex-1 bg-white/5" />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("border-white/10 mx-4 flex flex-col gap-1 border-l px-4 py-1", "group-data-[collapsible=icon]:hidden", className)} {...props} />
}

function SidebarMenuSubItem({ ...props }: React.ComponentProps<"li">) {
  return <li {...props} />
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean; size?: "sm" | "md"; isActive?: boolean }) {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      data-active={isActive}
      className={cn(
        "text-slate-400 hover:text-white flex h-8 items-center gap-2 overflow-hidden rounded-lg px-2 text-sm transition-all",
        isActive && "text-[#2b4cc4] font-bold bg-[#2b4cc4]/10",
        size === "sm" && "text-xs",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}