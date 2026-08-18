import { Button } from "@/components/ui/Button";

export function ClosingCta() {
  return (
    <section className="px-6 pt-32 max-w-[1600px] mx-auto">
      <div className="border-t pt-20 flex flex-col items-start" style={{ borderColor: "var(--kov-border)" }}>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Have a project?
          <br />
          <span className="text-kov-red">Let&apos;s build it.</span>
        </h2>

        <Button href="/contact" variant="primary" className="mt-10">
          Start a project →
        </Button>
      </div>
    </section>
  );
}
