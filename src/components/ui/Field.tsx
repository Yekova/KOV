"use client";

import { createContext, useContext, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { FIELD_CLASS, FIELD_LABEL, FIELD_STYLE } from "@/components/ui/fieldStyles";

// Un champ : son libellé, son contrôle, son erreur, son aide.
//
// Les formulaires de l'admin affichaient l'erreur en une seule phrase rouge
// sous le bouton d'envoi, sans jamais dire quel champ était en cause. Un
// devis à dix champs renvoyait « Référence requise. » et l'œil devait
// chercher.
//
// Le lien entre le libellé, le contrôle et le message passe par un contexte
// minuscule plutôt que par cloneElement : Input et Textarea lisent l'id
// qu'ils doivent porter, et le message qui les décrit. Ça évite d'avoir à
// deviner la forme des enfants, et ça marche avec n'importe quel contrôle
// qui accepte ces attributs.

interface FieldContextValue {
  id: string;
  errorId: string | undefined;
  hintId: string | undefined;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <FieldContext.Provider value={{ id, errorId, hintId, invalid: Boolean(error) }}>
      <div>
        <label htmlFor={id} className={FIELD_LABEL}>
          {label}
          {required && <span className="text-kov-red"> *</span>}
        </label>
        <div className="mt-1">{children}</div>
        {hint && !error && (
          <p id={hintId} className="text-kov-steel text-xs mt-1">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-kov-red text-xs mt-1">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

/** Ce qu'un contrôle doit porter pour être relié à son libellé et à son
 *  message. Rendu séparément pour que Select, qui a sa propre API, puisse
 *  s'y brancher sans passer par Input. */
export function useFieldProps() {
  const context = useContext(FieldContext);
  if (!context) return {};
  return {
    id: context.id,
    "aria-invalid": context.invalid || undefined,
    "aria-describedby": context.errorId ?? context.hintId,
  };
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const fieldProps = useFieldProps();
  const { className, style, ...rest } = props;
  return (
    <input
      {...fieldProps}
      {...rest}
      className={className ?? FIELD_CLASS}
      style={{ ...FIELD_STYLE, ...style }}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldProps = useFieldProps();
  const { className, style, rows, ...rest } = props;
  return (
    <textarea
      {...fieldProps}
      {...rest}
      rows={rows ?? 3}
      className={className ?? FIELD_CLASS}
      style={{ ...FIELD_STYLE, ...style }}
    />
  );
}
