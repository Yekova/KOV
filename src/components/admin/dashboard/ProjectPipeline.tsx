"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { updateProjectPipelineStage } from "@/app/admin/clients/actions";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type PipelineStage } from "@/lib/admin/status";
import { PipelineColumn } from "./PipelineColumn";
import type { PipelineProject } from "./PipelineProjectCard";

export function ProjectPipeline({ initialProjects }: { initialProjects: PipelineProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(stage: PipelineStage) {
    const id = draggingId;
    setDraggingId(null);
    if (!id) return;

    const project = projects.find((p) => p.id === id);
    if (!project || project.pipelineStage === stage) return;

    const previousStage = project.pipelineStage;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, pipelineStage: stage } : p)));

    updateProjectPipelineStage(id, stage).catch(() => {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, pipelineStage: previousStage } : p)));
    });
  }

  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Pipeline projets</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage}
            label={PIPELINE_STAGE_LABELS[stage]}
            projects={projects.filter((p) => p.pipelineStage === stage)}
            draggingId={draggingId}
            onDragStart={setDraggingId}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(stage)}
          />
        ))}
      </div>
    </GlassCard>
  );
}
