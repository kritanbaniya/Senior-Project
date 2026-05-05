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
  { title: "Dashboard", url: "/dashboard/doctor",             icon: LayoutDashboard },
  { title: "My Profile", url: "/dashboard/doctor/information", icon: UserRound },
  { title: "Clinic Info", url: "/clinic",                     icon: Building2 },
]

const doctorItems: SidebarItem[] = [
  { title: "Patient Notes",  url: "/dashboard/doctor", icon: FileText },
  { title: "Consultations",  url: "/dashboard/doctor", icon: Stethoscope },
  { title: "Records",        url: "/dashboard/doctor", icon: ClipboardList },
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
              "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors",
              isActive
                ? "bg-[#ede9fc] text-[#5548c8] font-[500]"
                : "font-[400] text-[#6b6590] hover:bg-[#f0ecfd] hover:text-[#6457c6]",
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

export default function DoctorSidebar() {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Doctor"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <Sidebar
      collapsible="icon"
      className="top-[52px] h-[calc(100vh-52px)] bg-white"
      style={{ borderRight: "1px solid rgba(124,111,224,0.22)" }}
    >
      <SidebarHeader className="border-b border-[rgba(124,111,224,0.22)] px-3 py-3">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ede9fc] text-[12px] font-[600] text-[#6457c6]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-[500] text-[#1e1b3a]">{displayName}</p>
              <p className="truncate text-[11px] text-[#4a3fa8]">Doctor Portal</p>
            </div>
          </div>

          <div className="flex items-center justify-center group-data-[collapsible=icon]:w-full">
            <SidebarTrigger className="h-7 w-7 rounded-md text-[#a89ee0] hover:bg-[#f0ecfd] hover:text-[#6457c6]" />
          </div>
        </div>

        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ede9fc] text-[12px] font-[600] text-[#6457c6]">
            {initials}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-[500] uppercase tracking-[0.07em] text-[#a89ee0]">
            Main
          </SidebarGroupLabel>
          <SidebarMenu>
            {mainItems.map((item) => (
              <SidebarLink key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-[500] uppercase tracking-[0.07em] text-[#a89ee0]">
            Doctor Tools
          </SidebarGroupLabel>
          <SidebarMenu>
            {doctorItems.map((item) => (
              <SidebarLink key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[rgba(124,111,224,0.22)] p-2">
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[#6b6590] transition-colors hover:bg-[#fff0f0] hover:text-red-600 group-data-[collapsible=icon]:justify-center"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
