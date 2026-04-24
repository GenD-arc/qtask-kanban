import {
  LayoutDashboard,
  KanbanSquare,
  ListTodo,
  Users,
  ActivitySquare,
  BarChart2,
  FlaskConical,
  ClipboardList,
  Settings2,
  Layers,
  AlertOctagon,
  CheckSquare,
  FileBarChart,
  FolderKanban
} from "lucide-react";

/**
 * Navigation config per role.
 * Each item:
 *   key              — unique identifier, used as the active page key
 *   label            — display text
 *   icon             — lucide-react component
 *   underDevelopment — grays out the item and shows "Under Development" badge
 */

const NAV_ITEMS = {
  Admin: [
    { key: "dashboard",       label: "Dashboard",       icon: LayoutDashboard }, //idk just yet if this is necessary kayo na lang muna bahala kung anong gagawin here
    { key: "kanban",          label: "Kanban Board",    icon: KanbanSquare    },
    { key: "users",           label: "User Management", icon: Users           },
    { key: "projects", label: "Projects", icon: FolderKanban },
   { key: "analytics",       label: "Analytics",       icon: BarChart2},
    { key: "phases",          label: "Phases",          icon: Layers          }, //kinda redundant and optional
    { key: "severities",      label: "Severities",      icon: AlertOctagon    }, //kinda redundant and optional
    { key: "statuses",        label: "Statuses",        icon: CheckSquare     }, //kinda redundant and optional
    { key: "logs",            label: "Activity Logs",   icon: ActivitySquare  },
  ],

  ProjectManager: [
    { key: "overview",        label: "Overview",        icon: LayoutDashboard },
    { key: "tasks",           label: "All Tasks",       icon: ListTodo        },
    { key: "logs",            label: "Activity Log",    icon: ActivitySquare  },
  ],

  Developer: [
    { key: "my-tasks",        label: "My Tasks",        icon: KanbanSquare    },
    { key: "all-tasks",       label: "All Tasks",       icon: ListTodo        },
    { key: "logs",            label: "Activity Log",    icon: ActivitySquare  },
  ],

  QA: [
    { key: "qa-board",        label: "QA Board",        icon: FlaskConical    },
    { key: "all-tasks",       label: "All Tasks",       icon: ListTodo        },
    { key: "logs",            label: "Activity Log",    icon: ActivitySquare  },
  ],
};

/**
 * Returns the nav items for a given role.
 * Falls back to an empty array if the role is unrecognized.
 */
export function getNavItems(role) {
  return NAV_ITEMS[role] ?? [];
}

/**
 * Returns the default page key for a given role
 * (the first item in the nav list).
 */
export function getDefaultPage(role) {
  return NAV_ITEMS[role]?.[0]?.key ?? null;
}