import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  UserRound,
  CalendarClock,
  ListOrdered,
  Building2,
  LogOut,
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
  SidebarTrigger
} from "@/components/ui/sidebar"

type SidebarItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
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
    title: "Appointments",
    url: "/dashboard/nurse/appointments",
    icon: CalendarClock,
  },
  {
    title: "Queue Management",
    url: "/dashboard/nurse/queue",
    icon: ListOrdered,
  },
  {
    title: "Clinic Info",
    url: "/clinic",
    icon: Building2,
  },
]

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/dashboard/nurse"}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:text-slate-900",
              isActive
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-700",
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

export default function NurseSideBar() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Nurse"

  return (
    <Sidebar
      collapsible="icon"
      className="top-[60px] h-[calc(100vh-60px)] border-r border-slate-200 bg-[#e6f4ea] text-slate-900"
    >
      <SidebarHeader className="border-b border-slate-300/70 bg-[#e6f4ea] px-3 py-4">
        <div className="flex items-start justify-between gap-3 group-data-[collapsible=icon]:justify-center">
          
          <div className="flex min-w-0 items-center gap-3 group-data-[collapsible=icon]:hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <img
                src="/assets/default_profile_picture.png"
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
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
      </SidebarHeader>

      <SidebarContent className="bg-[#e6f4ea]">
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

      <SidebarFooter className="border-t border-slate-300/70 bg-[#e6f4ea] p-3">
        <button
          onClick={() => void logout()}
          className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        >
          <LogOut className="inline mr-2 h-4 w-4" />
          Log Out
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}