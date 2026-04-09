import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  UserRound,
  MapPinned,
  CalendarClock,
  FileText,
  Activity,
  Pill,
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
    url: "/dashboard/patient",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    url: "/dashboard/patient/information",
    icon: UserRound,
  },
  {
    title: "Clinic Discovery",
    url: "/clinic-discovery",
    icon: MapPinned,
  },
]

const healthItems: SidebarItem[] = [
  {
    title: "Appointments",
    url: "/dashboard/patient/appointments",
    icon: CalendarClock,
  },
  {
    title: "Documents",
    url: "/dashboard/patient",
    icon: FileText,
  },
  {
    title: "Health Summary",
    url: "/dashboard/patient",
    icon: Activity,
  },
  {
    title: "Prescriptions",
    url: "/dashboard/patient",
    icon: Pill,
  },
]

function SidebarLink({
  item,
}: {
  item: SidebarItem
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/dashboard/patient"}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 px-3 py-2 font-medium transition-colors rounded-md",
              isActive
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-700 hover:bg-white/60 hover:text-indigo-700",
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

export default function PatientSidebar() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Patient"

  return (
    <Sidebar
      collapsible="icon"
      className="top-[60px] h-[calc(100vh-60px)] border-r border-slate-200 bg-[#d8eef7] text-yellow-600"
    >
      <SidebarHeader className="border-b border-slate-300/70 bg-[#d8eef7] px-3 py-4">
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
              Patient Portal
            </p>
          </div>
      </div>

      <div className="flex items-center justify-center group-data-[collapsible=icon]:w-full">
        <SidebarTrigger className="h-9 w-9 shrink-0 rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100" />
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

      <SidebarContent className="bg-[#d8eef7]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Main
          </SidebarGroupLabel>

          <SidebarMenu>
            {mainItems.map((item) => (
              <SidebarLink key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Health
          </SidebarGroupLabel>

          <SidebarMenu>
            {healthItems.map((item) => (
              <SidebarLink key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-300/70 bg-[#d8eef7] p-3 pb-4">
        <div className="rounded-xl bg-white/80 p-3 group-data-[collapsible=icon]:hidden">

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
  )
}