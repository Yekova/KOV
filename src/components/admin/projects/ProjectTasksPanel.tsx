"use client";

import { TaskListTable } from "@/components/admin/tasks/TaskListTable";
import { NewTaskModal } from "@/components/admin/tasks/NewTaskModal";
import type { PickerOption, TaskRow } from "@/components/admin/tasks/types";

export function ProjectTasksPanel({
  projectId,
  tasks,
  admins,
  phases,
}: {
  projectId: string;
  tasks: TaskRow[];
  admins: PickerOption[];
  phases: PickerOption[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewTaskModal projects={[]} admins={admins} phasesByProject={{ [projectId]: phases }} fixedProjectId={projectId} />
      </div>
      <TaskListTable tasks={tasks} showProject={false} />
    </div>
  );
}
