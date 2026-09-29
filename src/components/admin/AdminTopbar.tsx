import { GlobalAdminSearch, type AdminSearchItem } from "./GlobalAdminSearch";
import { QuickActionMenu } from "./QuickActionMenu";
import { NotificationBell, type NotificationItem } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

type PickerOption = { id: string; label: string };

// La zone de droite de la barre du haut.
//
// Ce n'était pas une zone mais LA barre : un <header> complet, avec sa
// hauteur, son fond et son bouton de menu mobile. Depuis que la navigation
// est horizontale, la barre appartient à AdminTopNavigation et ce composant
// n'en occupe plus que le côté droit — d'où la disparition de l'enveloppe
// et du MobileNavToggle, qui ferait doublon avec celui de la navigation.
export function AdminTopbarActions({
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
    <>
      {/* La recherche est masquée sous md : à cette largeur elle prendrait
          toute la barre, et l'icône de menu la rend accessible autrement. */}
      <div className="hidden md:block">
        <GlobalAdminSearch items={searchItems} />
      </div>
      <QuickActionMenu clients={clients} projects={projects} admins={admins} />
      <NotificationBell unreadCount={newLeadsCount} items={notifications} />
      <UserMenu fullName={fullName} roleLabel={roleLabel} isOnline={isOnline} />
    </>
  );
}
