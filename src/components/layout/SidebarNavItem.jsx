import clsx from "clsx";

/**
 * SidebarNavItem
 * Renders a single sidebar navigation item.
 *
 * Props:
 *   item       — nav item object from navigation.js { key, label, icon, underDevelopment }
 *   isActive   — whether this item is the current page
 *   collapsed  — whether the sidebar is in icon-only mode
 *   onClick    — called with item.key when clicked
 */
export default function SidebarNavItem({ item, isActive, collapsed, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => !item.underDevelopment && onClick(item.key)}
      title={collapsed ? item.label : undefined}
      className={clsx(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative",
        item.underDevelopment && "opacity-40 cursor-not-allowed"
      )}
      style={
        isActive
          ? {
              background: "rgba(59,130,246,0.18)",
              color: "#93c5fd",
              borderLeft: "2px solid #3b82f6",
              paddingLeft: "10px", // compensate for border
              fontWeight: 600,
            }
          : {
              color: "#94a3b8",
              borderLeft: "2px solid transparent",
            }
      }
      onMouseEnter={(e) => {
        if (!isActive && !item.underDevelopment) {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.color = "#e2e8f0";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !item.underDevelopment) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#94a3b8";
        }
      }}
    >
      {/* Icon */}
      <Icon size={17} className="shrink-0" />

      {/* Label + badge — hidden when collapsed */}
      {!collapsed && (
        <span className="flex items-center justify-between w-full">
          <span className="truncate text-sm font-medium">
            {item.label}
          </span>
          {item.underDevelopment && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}
            >
              Soon
            </span>
          )}
        </span>
      )}
    </button>
  );
}