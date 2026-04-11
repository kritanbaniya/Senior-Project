import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  UserRound,
  Building2,
  FileText,
  Stethoscope,
  ClipboardList,
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
  SidebarTrigger,
} from "@/components/ui/sidebar"

type SidebarItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const mainItems: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard/doctor",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    url: "/dashboard/doctor/information",
    icon: UserRound,
  },
  {
    title: "Clinic Info",
    url: "/clinic",
    icon: Building2,
  },
]

const doctorItems: SidebarItem[] = [
  {
    title: "Patient Notes",
    url: "/dashboard/doctor",
    icon: FileText,
  },
  {
    title: "Consultations",
    url: "/dashboard/doctor",
    icon: Stethoscope,
  },
  {
    title: "Records",
    url: "/dashboard/doctor",
    icon: ClipboardList,
  },
]

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/dashboard/doctor"}
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

export default function DoctorSidebar() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Doctor"

  return (
    <Sidebar
      collapsible="icon"
      className="top-[115px] h-[calc(100vh-120px)] rounded-2xl bg-white"
    >
      <SidebarHeader className="rounded-xl border border-slate-300 bg-white px-3 py-4">
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
                Doctor Portal
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

      <SidebarContent>
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
            Doctor Tools
          </SidebarGroupLabel>

          <SidebarMenu>
            {doctorItems.map((item) => (
              <SidebarLink key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="rounded-xl border border-slate-300/70 p-3 pb-4">
        <div className="rounded-xl bg-white p-3 group-data-[collapsible=icon]:hidden">
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
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