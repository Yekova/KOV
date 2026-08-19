import { GlobalAdminSearch, type AdminSearchItem } from "./GlobalAdminSearch";
import { QuickActionMenu } from "./QuickActionMenu";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

type PickerOption = { id: string; label: string };

export function AdminTopbar({
  searchItems,
  clients,
  projects,
  admins,
  newLeadsCount,
  fullName,
  roleLabel,
  isOnline,
}: {
  searchItems: AdminSearchItem[];
  clients: PickerOption[];
  projects: PickerOption[];
  admins: PickerOption[];
  newLeadsCount: number;
  fullName: string | null;
  roleLabel: string;
  isOnline: boolean;
}) {
  return (
    <header
      className="flex items-center gap-4 px-6 py-4 border-b"
      style={{ borderColor: "var(--kov-border)" }}
    >
      <GlobalAdminSearch items={searchItems} />
      <QuickActionMenu clients={clients} projects={projects} admins={admins} />
      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell unreadCount={newLeadsCount} />
        <UserMenu fullName={fullName} roleLabel={roleLabel} isOnline={isOnline} />
      </div>
    </header>
  );
}
