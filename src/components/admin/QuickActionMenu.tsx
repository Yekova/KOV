"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { createLead } from "@/app/admin/leads/actions";
import { createProject } from "@/app/admin/clients/actions";
import { createTask } from "@/app/admin/projects/actions";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";

type PickerOption = { id: string; label: string };

type QuickActionMenuProps = {
  clients: PickerOption[];
  projects: PickerOption[];
  admins: PickerOption[];
};

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

type ActiveModal = "lead" | "project" | "task" | null;

export function QuickActionMenu({ clients, projects, admins }: QuickActionMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const ref = useRef<HTMLDivElement>(null);

  function openModal(modal: ActiveModal) {
    setMenuOpen(false);
    setActiveModal(modal);
  }

  return (
    <div className="relative" ref={ref}>
      <Button type="button" variant="primary" onClick={() => setMenuOpen((v) => !v)}>
        + Nouvelle action
      </Button>

      {menuOpen && (
        <>
          <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }} onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-56 border py-2"
            style={{
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
            <div className="border-t my-2" style={{ borderColor: "var(--glass-border)" }} />
            <div className="px-4 py-2.5 text-sm text-kov-steel flex items-center justify-between">
              Nouveau client
              <span className="text-[10px] uppercase tracking-widest border px-1.5 py-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                Bientôt
              </span>
            </div>
            <div className="px-4 py-2.5 text-sm text-kov-steel flex items-center justify-between">
              Nouvelle facture
              <span className="text-[10px] uppercase tracking-widest border px-1.5 py-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                Bientôt
              </span>
            </div>
          </div>
        </>
      )}

      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
          onClick={() => setActiveModal(null)}
        >
          <GlassCard className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {activeModal === "lead" && (
              <form action={createLead} onSubmit={() => setActiveModal(null)} className="space-y-4">
                <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouveau lead</p>
                <input name="name" placeholder="Nom" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="email" type="email" placeholder="Email" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="phone" placeholder="Téléphone (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="company" placeholder="Entreprise (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="project_type" placeholder="Type de projet (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="budget_eur" placeholder="Budget estimé € (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <textarea name="message" placeholder="Message (facultatif)" rows={3} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <Button type="submit" variant="primary" className="w-full justify-center">
                  Créer le lead
                </Button>
              </form>
            )}

            {activeModal === "project" && (
              <form action={createProject} onSubmit={() => setActiveModal(null)} className="space-y-4">
                <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouveau projet</p>
                <select name="client_id" required defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                  <option value="" disabled>
                    Choisir un client…
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input name="name" placeholder="Nom du projet" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <input name="category" placeholder="Catégorie" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <select name="project_manager_id" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                  <option value="">Chef de projet (facultatif)</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <input name="budget_eur" placeholder="Budget € (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <select name="priority" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                  <option value="">Priorité (facultatif)</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="primary" className="w-full justify-center">
                  Créer le projet
                </Button>
              </form>
            )}

            {activeModal === "task" && (
              <form action={createTask} onSubmit={() => setActiveModal(null)} className="space-y-4">
                <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouvelle tâche</p>
                <select name="project_id" required defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                  <option value="" disabled>
                    Choisir un projet…
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input name="title" placeholder="Titre de la tâche" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <textarea name="description" placeholder="Description (facultatif)" rows={2} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <select name="assigned_to" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                  <option value="">Assigné à (facultatif)</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <select name="priority" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }}>
                  <option value="">Priorité (facultatif)</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
                <input name="due_date" type="date" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <Button type="submit" variant="primary" className="w-full justify-center">
                  Créer la tâche
                </Button>
              </form>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
