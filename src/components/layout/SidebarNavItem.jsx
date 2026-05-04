import { Link } from "react-router-dom";
import clsx from "clsx";

/**
 * SidebarNavItem
 * Renders a single sidebar navigation item as a router Link.
 *
 * Props:
 *   item       — nav item object from navigation.js { key, label, icon, underDevelopment }
 *   isActive   — whether this item is the current page
 *   collapsed  — whether the sidebar is in icon-only mode
 *   onClick    — called with item.key when clicked (kept for legacy compatibility)
 */
export default function SidebarNavItem({ item, isActive, collapsed, onClick }) {
  const Icon = item.icon;

  const handleClick = () => {
    if (!item.underDevelopment && onClick) onClick(item.key);
  };

  const content = (
    <>
      {/* Icon */}
      <Icon size={17} className="shrink-0" />

      {/* Label + badge — hidden when collapsed */}
      {!collapsed && (
        <span className="flex items-center justify-between w-full">
          <span className="truncate text-sm font-medium">{item.label}</span>
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
    </>
  );

  const sharedClassName = clsx(
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative",
    item.underDevelopment && "opacity-40 cursor-not-allowed pointer-events-none"
  );

  const activeStyle = {
    background: "rgba(59,130,246,0.18)",
    color: "#93c5fd",
    borderLeft: "2px solid #3b82f6",
    paddingLeft: "10px",
    fontWeight: 600,
  };

  const inactiveStyle = {
    color: "#94a3b8",
    borderLeft: "2px solid transparent",
  };

  if (item.underDevelopment) {
    return (
      <span
        title={collapsed ? item.label : undefined}
        className={sharedClassName}
        style={inactiveStyle}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      to={`/${item.key}`}
      title={collapsed ? item.label : undefined}
      className={sharedClassName}
      style={isActive ? activeStyle : inactiveStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.color = "#e2e8f0";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#94a3b8";
        }
      }}
    >
      {content}
    </Link>
  );
}
