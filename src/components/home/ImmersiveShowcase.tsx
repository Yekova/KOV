import { ApproachWheel } from "@/components/home/ApproachWheel";

// La deuxième section de la page d'accueil.
//
// Elle enveloppait ActivationWindow — une fenêtre macOS avec une colonne
// de gauche et un coverflow horizontal de six cartes, qui s'épinglait,
// grandissait en plein écran puis fondait au noir.
//
// Elle est remplacée par la roue : les trois cartes qui dépassent sous la
// hero en sont le haut, et le défilement la fait tourner. Le repère de
// section et l'identifiant d'ancre sont portés par ApproachWheel
// lui-même, qui a besoin d'être l'élément épinglé — une enveloppe
// supplémentaire entre lui et le flux de la page décalerait l'épinglage.
export function ImmersiveShowcase() {
  return <ApproachWheel />;
}
