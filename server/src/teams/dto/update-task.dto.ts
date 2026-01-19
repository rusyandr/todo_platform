export class UpdateTaskDto {
  title?: string;
  description?: string;
  deadline?: string | null;
  assigneeIds?: number[];
  dependencyIds?: number[];
}
