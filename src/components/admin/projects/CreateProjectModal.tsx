"use client";

import { Modal } from "@/components/ui/Modal";
import { ProjectForm, type PickerOption } from "./ProjectForm";

// La modale de création d'un projet depuis /admin/projects. Le formulaire
// lui-même vit dans ProjectForm, partagé avec le menu « + Nouvelle action »
// de la barre du haut — il en existait deux copies, et le commentaire qui
// était ici l'assumait.
export function CreateProjectModal({
  clients,
  admins,
  onClose,
}: {
  clients: PickerOption[];
  admins: PickerOption[];
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Nouveau projet" size="sm" closeOnBackdrop={false}>
      <ProjectForm clients={clients} admins={admins} onSuccess={onClose} />
    </Modal>
  );
}
