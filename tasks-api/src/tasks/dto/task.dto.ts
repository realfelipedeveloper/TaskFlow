export type TaskPayloadDto = {
  title?: string;
  description?: string;
  status?: string;
  due_date?: string | null;
  start_date?: string | null;
  doubt?: string | null;
  answer?: string | null;
  assigneeIds?: number[];
  branch?: string;
  commit?: string | null;
  pr?: string | null;
  projectId?: number | null;
  files?: string;
};
