export function ErrorState({ message = "Une erreur est survenue." }: { message?: string }) {
  return (
    <p className="text-kov-red text-sm py-6 text-center">
      {message} <span className="text-kov-steel">Réessayez plus tard.</span>
    </p>
  );
}
