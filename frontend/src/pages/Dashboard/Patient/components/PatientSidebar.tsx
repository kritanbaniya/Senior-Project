import { NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  LayoutDashboard,
  UserRound,
  MapPinned,
  CalendarClock,
  FileText,
  Pill,
  LogOut,
  FlaskConical,
  NotebookPen,
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

type PatientSidebarProps = {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const mainItems: SidebarItem[] = [
  { title: "Dashboard",        url: "/dashboard/patient",             icon: LayoutDashboard },
  { title: "My Profile",       url: "/dashboard/patient/information", icon: UserRound },
  { title: "Clinic Discovery", url: "/clinic-discovery",              icon: MapPinned },
]

const healthItems: SidebarItem[] = [
  { title: "Appointments",        url: "/dashboard/patient/appointments", icon: CalendarClock },
  { title: "Documents",           url: "/dashboard/patient",             icon: FileText },
  { title: "Visit Summary Notes", url: "/dashboard/patient/",            icon: NotebookPen },
  { title: "Lab Results",         url: "/dashboard/patient",             icon: FlaskConical },
  { title: "Prescriptions",       url: "/dashboard/patient",             icon: Pill },
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
          end={item.url === "/dashboard/patient"}
          onClick={onNavigate}
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

export default function PatientSidebar({
  mobileOpen = false,
  onMobileClose,
}: PatientSidebarProps) {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Patient"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-50 bg-white transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-black/[0.08] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[12px] font-[600] text-[#4f46e5]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-[500] text-[#111827]">{displayName}</p>
                <p className="truncate text-[11px] text-[#9ca3af]">Patient Portal</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onMobileClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f5f5f7]"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-[500] uppercase tracking-[0.07em] text-[#9ca3af]">
                Main
              </SidebarGroupLabel>
              <SidebarMenu className="space-y-0.5">
                {mainItems.map((item) => (
                  <SidebarLink key={item.title} item={item} onNavigate={onMobileClose} />
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-[10px] font-[500] uppercase tracking-[0.07em] text-[#9ca3af]">
                Health
              </SidebarGroupLabel>
              <SidebarMenu className="space-y-0.5">
                {healthItems.map((item) => (
                  <SidebarLink key={item.title} item={item} onNavigate={onMobileClose} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>

          <div className="border-t border-black/[0.08] p-2">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[#6b7280] transition-colors hover:bg-[#fff0f0] hover:text-red-600"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <Sidebar
        collapsible="icon"
        className="hidden bg-white md:flex md:top-[52px] md:h-[calc(100vh-52px)]"
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
                <p className="truncate text-[11px] text-[#9ca3af]">Patient Portal</p>
              </div>
            </div>

            <div className="hidden items-center justify-center group-data-[collapsible=icon]:w-full md:flex">
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
              Main
            </SidebarGroupLabel>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarLink key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-[500] uppercase tracking-[0.07em] text-[#9ca3af]">
              Health
            </SidebarGroupLabel>
            <SidebarMenu>
              {healthItems.map((item) => (
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
    </>
  )
}
