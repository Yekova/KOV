"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { FIELD_CLASS } from "@/components/ui/fieldStyles";
import { NewLeadForm } from "@/app/admin/leads/NewLeadForm";
import { ProjectForm } from "@/components/admin/projects/ProjectForm";
import { createLead } from "@/app/admin/leads/actions";
import { createClient, createProject } from "@/app/admin/clients/actions";
import { createTask } from "@/app/admin/projects/actions";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";

const MODAL_TITLES = {
  lead: "Nouveau lead",
  client: "Nouveau client",
  project: "Nouveau projet",
  task: "Nouvelle tâche",
} as const;

type PickerOption = { id: string; label: string };

type QuickActionMenuProps = {
  clients: PickerOption[];
  projects: PickerOption[];
  admins: PickerOption[];
};

type ActiveModal = "lead" | "client" | "project" | "task" | null;

const ACTIONS = { lead: createLead, client: createClient, project: createProject, task: createTask } as const;

export function QuickActionMenu({ clients, projects, admins }: QuickActionMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Portaled to document.body below (see the backdrop-filter-breaks-hit-testing
  // note on the dropdown), so its position can no longer come from CSS
  // "position: absolute" relative to this local wrapper — computed here instead.
  function toggleMenu() {
    if (!menuOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setMenuOpen((v) => !v);
  }

  function openModal(modal: ActiveModal) {
    setMenuOpen(false);
    setError(null);
    setActiveModal(modal);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeModal) return;
    const action = ACTIONS[activeModal];
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const result = await action(formData);
        // Some actions (e.g. createLead) return { error } instead of
        // throwing for expected validation failures — Next.js 16 redacts
        // thrown Server Action error messages in production, so this is
        // the only way those actions' real message reaches the user.
        if (result && typeof result === "object" && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        setActiveModal(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'action a échoué.");
      }
    });
  }

  return (
    <div className="relative" ref={ref}>
      <Button type="button" variant="primary" onClick={toggleMenu}>
        + Nouvelle action
      </Button>

      {menuOpen &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }} onClick={() => setMenuOpen(false)} />
            <div
              className="fixed w-56 border py-2"
              style={{
                top: menuPosition.top,
                right: menuPosition.right,
                zIndex: "var(--z-modal)",
                background: "var(--glass-bg)",
                backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                borderColor: "var(--glass-border)",
                borderRadius: "var(--radius-glass)",
                boxShadow: "var(--glass-shadow-full)",
              }}
            >
              <button
                type="button"
                onClick={() => openModal("lead")}
                className="w-full text-left px-4 py-2.5 text-sm text-kov-bone hover:text-kov-red transition-colors"
              >
                Nouveau lead
              </button>
              <button
                type="button"
                onClick={() => openModal("project")}
                className="w-full text-left px-4 py-2.5 text-sm text-kov-bone hover:text-kov-red transition-colors"
              >
                Nouveau projet
              </button>
              <button
                type="button"
                onClick={() => openModal("task")}
                className="w-full text-left px-4 py-2.5 text-sm text-kov-bone hover:text-kov-red transition-colors"
              >
                Nouvelle tâche
              </button>
              <button
                type="button"
                onClick={() => openModal("client")}
                className="w-full text-left px-4 py-2.5 text-sm text-kov-bone hover:text-kov-red transition-colors"
              >
                Nouveau client
              </button>
              <div className="border-t my-2" style={{ borderColor: "var(--glass-border)" }} />
              <div className="px-4 py-2.5 text-sm text-kov-steel flex items-center justify-between">
                Nouvelle facture
                <span className="text-[10px] uppercase tracking-widest border px-1.5 py-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                  Bientôt
                </span>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* Le formulaire de lead et celui de projet sont maintenant importés
          plutôt que recopiés ici. Les deux copies avaient déjà divergé :
          celle-ci avait perdu le champ « délai » que NewLeadForm porte,
          donc un lead créé depuis la barre du haut le perdait en silence. */}
      <Modal
        open={activeModal !== null}
        onClose={() => {
          setActiveModal(null);
          setError(null);
        }}
        title={MODAL_TITLES[activeModal ?? "lead"]}
        size="sm"
        closeOnBackdrop={false}
      >
            {activeModal === "lead" && <NewLeadForm onSuccess={() => setActiveModal(null)} />}

            {activeModal === "project" && (
              <ProjectForm clients={clients} admins={admins} onSuccess={() => setActiveModal(null)} />
            )}

            {activeModal === "client" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouveau client</p>
                <p className="text-kov-steel text-xs -mt-2">
                  Une invitation lui sera envoyée pour qu&apos;il crée son accès à l&apos;espace client.
                </p>
                <input name="full_name" placeholder="Nom complet" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="email" type="email" placeholder="Email" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="company" placeholder="Entreprise (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="phone" placeholder="Téléphone (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <Select
                  name="account_manager_id"
                  placeholder="Responsable de compte (facultatif)"
                  options={admins.map((a) => ({ value: a.id, label: a.label }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                {error && <p className="text-kov-red text-xs">{error}</p>}
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={isPending}>
                  {isPending ? "Création…" : "Créer le client"}
                </Button>
              </form>
            )}

            {activeModal === "task" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouvelle tâche</p>
                <Select
                  name="project_id"
                  defaultValue=""
                  placeholder="Choisir un projet…"
                  options={projects.map((p) => ({ value: p.id, label: p.label }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                <input name="title" placeholder="Titre de la tâche" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <textarea name="description" placeholder="Description (facultatif)" rows={2} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <Select
                  name="assigned_to"
                  defaultValue=""
                  placeholder="Assigné à (facultatif)"
                  options={admins.map((a) => ({ value: a.id, label: a.label }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                <Select
                  name="priority"
                  defaultValue=""
                  placeholder="Priorité (facultatif)"
                  options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                <input name="due_date" type="date" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                {error && <p className="text-kov-red text-xs">{error}</p>}
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={isPending}>
                  {isPending ? "Création…" : "Créer la tâche"}
                </Button>
              </form>
            )}
      </Modal>
    </div>
  );
}
