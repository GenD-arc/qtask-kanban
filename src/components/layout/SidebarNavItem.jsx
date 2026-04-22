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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative",
        isActive
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        item.underDevelopment && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Icon */}
      <Icon size={18} className="shrink-0" />

      {/* Label + badge — hidden when collapsed */}
      {!collapsed && (
        <span className="flex items-center justify-between w-full">
          <span className="truncate">{item.label}</span>
          {item.underDevelopment && (
            <span className="text-[10px] font-medium bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              Under Development
            </span>
          )}
        </span>
      )}
    </button>
  );
}