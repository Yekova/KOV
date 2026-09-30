"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { KovActionButton, type ActionState } from "@/components/ui/KovActionButton";
import { ValidationWorkspace } from "./ValidationWorkspace";
import { addPage, addVersion, patchPage, publishVersion, uploadVersionAsset } from "@/lib/design/actions";
import { DEVICE_LABELS, DEVICES, PAGE_STATUS_COLORS, PAGE_STATUS_LABELS, type Device } from "@/lib/design/status";
import type { DesignActivityEntry, ValidationBoard } from "@/lib/design/types";

// Ce que KOV peut faire et que le client ne peut pas (§33/§34).
//
// La barre de structure vit AU-DESSUS de l'espace partagé, pas dedans :
// l'espace en dessous est exactement celui que voit le client, écran pour
// écran. C'est la seule façon de ne pas découvrir après coup qu'on lui a
// publié une page vide.

export function AdminValidationPanel({
  board,
  activity,
}: {
  board: ValidationBoard;
  activity: DesignActivityEntry[];
}) {
  const router = useRouter();
  const [creatingPage, setCreatingPage] = useState(false);
  const [versionFor, setVersionFor] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="kov-card px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-kov-steel text-[11px] tracking-widest uppercase">Structure</h2>
          <button
            type="button"
            onClick={() => setCreatingPage(true)}
            className="text-kov-white hover:bg-kov-red-signal ml-auto inline-flex h-9 items-center px-4 text-[11px] tracking-widest uppercase transition-colors"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          >
            + Ajouter une page
          </button>
        </div>

        {board.pages.length > 0 && (
          <ul className="mt-4 divide-y" style={{ borderColor: "var(--kov-border)" }}>
            {board.pages.map((page) => {
              const current = page.versions.find((v) => v.id === page.currentVersionId) ?? null;
              const draft = page.versions.find((v) => v.status === "draft") ?? null;
              return (
                <li key={page.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-kov-bone truncate text-sm">{page.title}</p>
                    <p className="mt-0.5 text-[10px] tracking-widest uppercase" style={{ color: PAGE_STATUS_COLORS[page.status] }}>
                      {PAGE_STATUS_LABELS[page.status]}
                      {current && <span className="text-kov-steel"> · {current.label}</span>}
                      {!page.visibleToClient && <span className="text-kov-steel"> · masquée au client</span>}
                    </p>
                  </div>

                  <VisibilityToggle projectId={board.projectId} page={page} onDone={() => router.refresh()} />

                  <button
                    type="button"
                    onClick={() => setVersionFor(page.id)}
                    className="text-kov-concrete hover:text-kov-red text-[10px] tracking-widest uppercase transition-colors"
                  >
                    Nouvelle version
                  </button>

                  {draft && (
                    <PublishButton
                      projectId={board.projectId}
                      versionId={draft.id}
                      label={draft.label}
                      onDone={() => router.refresh()}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ValidationWorkspace initialBoard={board} activity={activity} />

      <NewPageModal
        open={creatingPage}
        projectId={board.projectId}
        onClose={() => setCreatingPage(false)}
        onDone={() => {
          setCreatingPage(false);
          router.refresh();
        }}
      />

      <NewVersionModal
        open={versionFor !== null}
        projectId={board.projectId}
        pageId={versionFor}
        onClose={() => setVersionFor(null)}
        onDone={() => {
          setVersionFor(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function VisibilityToggle({
  projectId,
  page,
  onDone,
}: {
  projectId: string;
  page: ValidationBoard["pages"][number];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await patchPage(projectId, page.id, { visibleToClient: !page.visibleToClient });
          if (result.error) toast.error(result.error);
          else {
            toast.success(page.visibleToClient ? "Page masquée au client." : "Page ouverte au client.");
            onDone();
          }
        })
      }
      className="text-kov-concrete hover:text-kov-red text-[10px] tracking-widest uppercase transition-colors disabled:opacity-50"
    >
      {page.visibleToClient ? "Masquer" : "Ouvrir au client"}
    </button>
  );
}

function PublishButton({
  projectId,
  versionId,
  label,
  onDone,
}: {
  projectId: string;
  versionId: string;
  label: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await publishVersion(projectId, versionId);
          if (result.error) toast.error(result.error);
          else {
            toast.success(`${label} publiée.`);
            onDone();
          }
        })
      }
      className="text-[10px] tracking-widest uppercase transition-colors disabled:opacity-50"
      style={{ color: "var(--kov-status-green)" }}
    >
      Publier {label}
    </button>
  );
}

function NewPageModal({
  open,
  projectId,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [state, setState] = useState<ActionState>("idle");

  function submit() {
    if (!title.trim()) return;
    setState("loading");
    void addPage(projectId, title).then((result) => {
      if (result.error) {
        setState("error");
        toast.error(result.error);
        return;
      }
      setState("success");
      setTitle("");
      onDone();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter une page"
      footer={
        <div className="flex justify-end gap-2">
          <KovActionButton variant="secondary" type="button" state="idle" onClick={onClose}>
            Annuler
          </KovActionButton>
          <KovActionButton
            variant="primary"
            type="button"
            state={state}
            onStateSettled={() => setState("idle")}
            onClick={submit}
          >
            Créer
          </KovActionButton>
        </div>
      }
    >
      <Field label="Titre de la page" hint="Par exemple « Page d'accueil » ou « Tunnel de commande ».">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
      </Field>
      <p className="text-kov-steel mt-3 text-[11px] leading-relaxed">
        La page est créée masquée. Elle s&apos;ouvre au client au moment où vous publiez une première version.
      </p>
    </Modal>
  );
}

function NewVersionModal({
  open,
  projectId,
  pageId,
  onClose,
  onDone,
}: {
  open: boolean;
  projectId: string;
  pageId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [label, setLabel] = useState("");
  const [changelog, setChangelog] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [files, setFiles] = useState<Partial<Record<Device, File>>>({});
  const [state, setState] = useState<ActionState>("idle");
  const [step, setStep] = useState<string | null>(null);

  function submit() {
    if (!pageId) return;
    const chosen = DEVICES.filter((d) => files[d]);
    if (chosen.length === 0) {
      toast.error("Ajoutez au moins une maquette.");
      return;
    }

    setState("loading");
    void (async () => {
      setStep("Création de la version…");
      const created = await addVersion({
        projectId,
        pageId,
        label: label || null,
        changelog: changelog || null,
        previewUrl: previewUrl || null,
      });
      if (created.error || !created.versionId) {
        setState("error");
        setStep(null);
        toast.error(created.error ?? "La version n'a pas pu être créée.");
        return;
      }

      // Les fichiers partent un par un : un téléversement qui échoue ne
      // doit pas emporter ceux qui ont réussi, et l'étape affichée dit
      // lequel est en cours.
      for (const device of chosen) {
        setStep(`Envoi de la maquette ${DEVICE_LABELS[device].toLowerCase()}…`);
        const form = new FormData();
        form.set("projectId", projectId);
        form.set("pageId", pageId);
        form.set("versionId", created.versionId);
        form.set("versionNumber", String(created.versionNumber ?? 1));
        form.set("device", device);
        form.set("file", files[device]!);
        const uploaded = await uploadVersionAsset(form);
        if (uploaded.error) {
          setState("error");
          setStep(null);
          toast.error(`${DEVICE_LABELS[device]} : ${uploaded.error}`);
          return;
        }
      }

      setState("success");
      setStep(null);
      setLabel("");
      setChangelog("");
      setPreviewUrl("");
      setFiles({});
      toast.success("Version créée. Publiez-la pour l'envoyer au client.");
      onDone();
    })();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle version"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          {step && <span className="text-kov-steel mr-auto text-[11px]">{step}</span>}
          <KovActionButton variant="secondary" type="button" state="idle" onClick={onClose}>
            Annuler
          </KovActionButton>
          <KovActionButton
            variant="primary"
            type="button"
            state={state}
            loadingLabel="Envoi…"
            onStateSettled={() => setState("idle")}
            onClick={submit}
          >
            Créer la version
          </KovActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Étiquette" hint="Laissée vide, elle sera numérotée automatiquement (v1, v2…).">
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="v2.1" />
        </Field>

        <Field label="Modifications" hint="Ce que cette version change. Le client le lit avant de regarder (§59).">
          <Textarea
            value={changelog}
            onChange={(event) => setChangelog(event.target.value)}
            rows={3}
            placeholder={"- Hero assombri\n- CTA déplacé"}
          />
        </Field>

        <Field label="Préversion en ligne" hint="Facultatif. HTTPS uniquement — toute autre adresse est refusée.">
          <Input
            value={previewUrl}
            onChange={(event) => setPreviewUrl(event.target.value)}
            placeholder="https://staging.exemple.fr"
            inputMode="url"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          {DEVICES.map((device) => (
            <label key={device} className="block">
              <span className="text-kov-steel text-[10px] tracking-widest uppercase">{DEVICE_LABELS[device]}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(event) =>
                  setFiles((previous) => ({ ...previous, [device]: event.target.files?.[0] ?? undefined }))
                }
                className="text-kov-concrete mt-2 block w-full text-[11px]"
              />
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
