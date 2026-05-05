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
    title: "Visit Summary Notes",
    url: "/dashboard/patient/",
    icon: NotebookPen,
  },
  {
    title: "Lab Results",
    url: "/dashboard/patient",
    icon: FlaskConical,
  },
  {
    title: "Prescriptions",
    url: "/dashboard/patient",
    icon: Pill,
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
          end={item.url === "/dashboard/patient"}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-5 text-[16px] font-medium transition-colors",
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

export default function PatientSidebar({
  mobileOpen = false,
  onMobileClose,
}: PatientSidebarProps) {
  const { profile, logout } = useAuth()
  const displayName = profile?.full_name?.trim() || "Patient"

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
                  Patient Portal
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
              <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Main
              </SidebarGroupLabel>

              <SidebarMenu className="space-y-1">
                {mainItems.map((item) => (
                  <SidebarLink
                    key={item.title}
                    item={item}
                    onNavigate={onMobileClose}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Health
              </SidebarGroupLabel>

              <SidebarMenu className="space-y-1">
                {healthItems.map((item) => (
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
        className="hidden bg-white md:flex md:top-[60px] md:h-[calc(100vh-65px)] md:rounded-2xl"
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
                  Patient Portal
                </p>
              </div>
            </div>

            <div className="hidden items-center justify-center group-data-[collapsible=icon]:w-full md:flex">
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
              Health
            </SidebarGroupLabel>

            <SidebarMenu>
              {healthItems.map((item) => (
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
    </>
  )
}
