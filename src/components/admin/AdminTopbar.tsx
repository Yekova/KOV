import { GlobalAdminSearch, type AdminSearchItem } from "./GlobalAdminSearch";
import { QuickActionMenu } from "./QuickActionMenu";
import { NotificationBell, type NotificationItem } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

type PickerOption = { id: string; label: string };

export function AdminTopbar({
  searchItems,
  clients,
  projects,
  admins,
  newLeadsCount,
  notifications,
  fullName,
  roleLabel,
  isOnline,
}: {
  searchItems: AdminSearchItem[];
  clients: PickerOption[];
  projects: PickerOption[];
  admins: PickerOption[];
  newLeadsCount: number;
  notifications: NotificationItem[];
  fullName: string | null;
  roleLabel: string;
  isOnline: boolean;
}) {
  return (
    <header className="flex items-center gap-4 px-6 py-4" style={{ background: "var(--kov-carbon)" }}>
      <GlobalAdminSearch items={searchItems} />
      <QuickActionMenu clients={clients} projects={projects} admins={admins} />
      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell unreadCount={newLeadsCount} items={notifications} />
        <UserMenu fullName={fullName} roleLabel={roleLabel} isOnline={isOnline} />
      </div>
    </header>
  );
}
