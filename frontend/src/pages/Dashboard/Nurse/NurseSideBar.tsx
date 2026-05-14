import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  UserRound,
  CalendarClock,
  ListOrdered,
  LogOut,
  X,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type SidebarItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

type NurseSidebarProps = {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const mainItems: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard/nurse",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    url: "/dashboard/nurse/information",
    icon: UserRound,
  },
]

const workItems: SidebarItem[] = [
  {
    title: "Appointment Manager",
    url: "/dashboard/nurse/appointments",
    icon: CalendarClock,
  },
  {
    title: "Queue Management",
    url: "/dashboard/nurse/queue",
    icon: ListOrdered,
  },
]

function SidebarLink({
  item,
  onNavigate,
}: {
  item: SidebarItem
  onNavigate?: () => void
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/dashboard/nurse"}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 px-3 py-5 text-[16px] bg-white border border-slate-300 font-medium transition-colors rounded-lg",
              isActive
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-700 hover:bg-indigo-200 hover:text-indigo-700",
            ].join(" ")
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function NurseSideBar({
  mobileOpen = false,
  onMobileClose,
}: NurseSidebarProps) {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Nurse"

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-6 py-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
                <img
                  src="/assets/default_profile_picture.png"
                  alt="Profile Picture"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold leading-tight text-slate-900">
                  {displayName}
                </h2>
                <p className="truncate text-sm font-medium text-slate-500">
                  Nurse Portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onMobileClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-red-500/80 text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-bold uppercase text-slate-600">
                Main
              </SidebarGroupLabel>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarLink
                    key={item.title}
                    item={item}
                    onNavigate={onMobileClose}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-bold uppercase text-slate-600">
                Work
              </SidebarGroupLabel>
              <SidebarMenu>
                {workItems.map((item) => (
                  <SidebarLink
                    key={item.title}
                    item={item}
                    onNavigate={onMobileClose}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/60 p-6">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-500 py-4 text-sm font-semibold text-white transition hover:bg-indigo-600"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      <Sidebar
        collapsible="icon"
        className="hidden top-[60px] h-[calc(100vh-65px)] bg-white rounded-2xl md:flex"
      >
        <SidebarHeader className="border bg-white rounded-xl border-slate-300 px-3 py-4">
          <div className="flex items-start justify-between gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex min-w-0 items-center gap-3 group-data-[collapsible=icon]:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <img
                  src="/assets/default_profile_picture.png"
                  alt="Profile Picture"
                  className="h-12 w-10 rounded-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="truncate text-xs font-semibold text-slate-600">
                  Nurse Portal
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center group-data-[collapsible=icon]:w-full">
              <SidebarTrigger className="h-9 w-9 rounded-md border border-slate-300 bg-white shadow-sm" />
            </div>
          </div>

          <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <img
                src="/assets/default_profile_picture.png"
                alt="Profile Picture"
                className="h-10 w-8 rounded-full object-cover"
              />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold uppercase text-slate-600">
              Main
            </SidebarGroupLabel>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarLink key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-bold uppercase text-slate-600">
              Work
            </SidebarGroupLabel>
            <SidebarMenu>
              {workItems.map((item) => (
                <SidebarLink key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border rounded-xl border-slate-300/70 p-3 pb-4">
          <div className="rounded-xl bg-white p-3 group-data-[collapsible=icon]:hidden">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>

          <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white transition hover:bg-indigo-600"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-8" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}