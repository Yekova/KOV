// Les six réactions, dans un module que le NAVIGATEUR peut importer.
//
// Elles vivaient dans lib/messaging/extras, qui commence par
// `import "server-only"` — la rangée de réactions est rendue côté client,
// et l'importer de là ferait échouer la compilation.
//
// Fermées, et contraintes en base autant qu'ici (voir la migration
// 20260929140000). Une liste ouverte laisse entrer n'importe quelle
// chaîne, et la rangée sous un message devient une ligne de vingt emoji
// posés une fois chacun — illisible, et impossible à compter d'un coup
// d'œil.
export const KOV_REACTIONS = ["👍", "❤️", "👏", "✅", "🔥", "🤔"] as const;
export type KovReaction = (typeof KOV_REACTIONS)[number];

export function isKovReaction(value: string): value is KovReaction {
  return (KOV_REACTIONS as readonly string[]).includes(value);
}
