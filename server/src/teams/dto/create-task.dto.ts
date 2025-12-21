export class CreateTaskDto {
  title: string;
  description?: string;
  assigneeIds: number[];
  deadline?: string;
  dependencyIds?: number[];
}
