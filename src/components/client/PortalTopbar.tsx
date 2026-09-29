"use client";

import { NotificationBell, type ClientNotificationItem } from "./NotificationBell";
import { PortalSearch, type PortalSearchItem } from "./PortalSearch";
import { UserMenu } from "./UserMenu";

// La zone de droite de la barre du haut.
//
// Ce n'était pas une zone mais LA barre : un <header> complet avec sa
// hauteur, son fond et son bouton de menu mobile. Depuis que la navigation
// est horizontale, la barre appartient à PortalTopNavigation — d'où la
// disparition de l'enveloppe et du bouton de menu, qui ferait doublon avec
// celui de la navigation.
export function PortalTopbarActions({
  fullName,
  avatarUrl,
  unreadCount,
  notifications,
  searchIndex,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
  notifications: ClientNotificationItem[];
  searchIndex: PortalSearchItem[];
}) {
  return (
    <>
      {/* La recherche est dans la coquille, donc sur chaque écran :
          chercher une facture depuis la page Documents obligeait sinon à
          revenir en arrière. Masquée sous md, où elle prendrait toute la
          barre. */}
      <div className="hidden md:block">
        <PortalSearch items={searchIndex} />
      </div>
      <NotificationBell unreadCount={unreadCount} items={notifications} />
      <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
    </>
  );
}
