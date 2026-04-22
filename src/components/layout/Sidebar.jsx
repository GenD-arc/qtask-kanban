import { useState } from "react";
import { ChevronLeft, ChevronRight, FolderKanban, ChevronsUpDown } from "lucide-react";
import { getNavItems } from "../../config/navigation";
import SidebarNavItem from "./SidebarNavItem";

/**
 * Sidebar
 *
 * Props:
 *   currentUser     — { name, role, ... }
 *   activePage      — current page key
 *   onNavigate      — called with page key when a nav item is clicked
 *   onLogout        — called when sign out is clicked
 *   projects        — array of projects available to this user
 *   activeProjectId — currently selected project id
 *   onProjectChange — called with project id when switcher changes
 */
export default function Sidebar({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  projects        = [],
  activeProjectId = null,
  onProjectChange,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems      = getNavItems(currentUser.role);
  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <aside
      className={`
        relative flex flex-col bg-white border-r border-gray-200
        transition-all duration-200 ease-in-out shrink-0
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* ── Collapse toggle ───────────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 bg-white border border-gray-200
                   rounded-full p-0.5 text-gray-400 hover:text-gray-600
                   hover:border-gray-300 transition-colors shadow-sm"
      >
        {collapsed
          ? <ChevronRight size={14} />
          : <ChevronLeft  size={14} />
        }
      </button>

      {/* ── Logo ──────────────────────────────────────────── */}
      <div className={`flex items-center gap-2.5 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <FolderKanban size={22} className="text-blue-600 shrink-0" />
        {!collapsed && (
          <span className="text-base font-bold text-gray-800 truncate">QTask</span>
        )}
      </div>

      {/* ── Project switcher ──────────────────────────────── */}
      {!collapsed && (
        <div className="mx-3 mb-3">
          {projects.length === 0 ? (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400">No projects assigned</span>
            </div>
          ) : (
            <div className="relative">
              <select
                value={activeProjectId ?? ""}
                onChange={(e) => onProjectChange?.(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 hover:bg-gray-100
                           rounded-lg px-3 py-2 pr-7 text-xs font-medium
                           text-gray-600 border-none focus:outline-none
                           focus:ring-2 focus:ring-blue-500 cursor-pointer
                           transition-colors truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <ChevronsUpDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2
                           text-gray-400 pointer-events-none shrink-0"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.key}
            item={item}
            isActive={activePage === item.key}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* ── User info + sign out ───────────────────────────── */}
      <div className={`
        border-t border-gray-200 px-3 py-4
        flex items-center gap-3
        ${collapsed ? "justify-center" : ""}
      `}>
        {/* Avatar */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600
                        flex items-center justify-center text-xs font-bold uppercase">
          {currentUser.name.charAt(0)}
        </div>

        {/* Name + role + sign out */}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-0.5"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}