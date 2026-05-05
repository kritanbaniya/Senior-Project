import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  Building2,
  UsersRound,
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

const clinicItems: SidebarItem[] = [
  { title: "Overview",      url: "/dashboard/clinic",             icon: LayoutDashboard },
  { title: "My Clinic",     url: "/dashboard/clinic/my-clinic",   icon: Building2 },
  { title: "Manage Staff",  url: "/dashboard/clinic/manage-staff", icon: UsersRound },
]

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <NavLink
          to={item.url}
          end={item.url === "/dashboard/clinic"}
          className={({ isActive }) =>
            [
              "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
              isActive
                ? "bg-[#eef2ff] text-[#4f46e5] font-[500]"
                : "font-[400] text-[#6b7280] hover:bg-[#f5f5f7] hover:text-[#111827]",
            ].join(" ")
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function ClinicSideBar() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Clinic Admin"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <Sidebar
      collapsible="icon"
      className="top-[52px] h-[calc(100vh-52px)] bg-white"
      style={{ borderRight: "0.5px solid rgba(0,0,0,0.08)" }}
    >
      <SidebarHeader className="border-b border-black/[0.08] px-3 py-3">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-[600] text-[#4f46e5]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-[500] text-[#111827]">{displayName}</p>
              <p className="truncate text-[11px] text-[#9ca3af]">Clinic Portal</p>
            </div>
          </div>

          <div className="flex items-center justify-center group-data-[collapsible=icon]:w-full">
            <SidebarTrigger className="h-7 w-7 rounded-md text-[#9ca3af] hover:bg-[#f5f5f7] hover:text-[#111827]" />
          </div>
        </div>

        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-[600] text-[#4f46e5]">
            {initials}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-[500] uppercase tracking-[0.07em] text-[#9ca3af]">
            Clinic
          </SidebarGroupLabel>
          <SidebarMenu>
            {clinicItems.map((item) => (
              <SidebarLink key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-black/[0.08] p-2">
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[#6b7280] transition-colors hover:bg-[#fff0f0] hover:text-red-600 group-data-[collapsible=icon]:justify-center"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
