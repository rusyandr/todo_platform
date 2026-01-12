import { useEffect, useState, useMemo } from 'react';
import { api } from '../api/axios';
import type { AuthUser } from './AuthBar';
import './Tasks.css';

interface Task {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  isCompleted: boolean;
  team?: {
    id: number;
    name: string;
    subject?: {
      id: number;
      title: string;
    };
  };
  assignees?: Array<{
    id: number;
    user: {
      id: number;
      name: string;
    };
  }>;
}

interface TasksProps {
  currentUser: AuthUser | null;
}

type SortMode = 'deadline-asc' | 'deadline-desc';

export function Tasks({ currentUser }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('deadline-asc');
  const [subjectFilter, setSubjectFilter] = useState<number | null>(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api
      .get<Task[]>('/tasks')
      .then((res) => setTasks(res.data))
      .catch(() => setError('Не удалось получить задачи'))
      .finally(() => setIsLoading(false));
  }, [currentUser]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    if (showOnlyMine && currentUser) {
      filtered = filtered.filter((task) =>
        task.assignees?.some((assignee) => assignee.user.id === currentUser.id),
      );
    }

    if (subjectFilter) {
      filtered = filtered.filter((task) => task.team?.subject?.id === subjectFilter);
    }

    filtered.sort((a, b) => {
      if (sortMode === 'deadline-asc') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      } else {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      }
    });

    return filtered;
  }, [tasks, sortMode, subjectFilter, showOnlyMine, currentUser]);

  const subjects = useMemo(() => {
    const subjectMap = new Map<number, { id: number; title: string }>();
    tasks.forEach((task) => {
      if (task.team?.subject) {
        subjectMap.set(task.team.subject.id, task.team.subject);
      }
    });
    return Array.from(subjectMap.values());
  }, [tasks]);

  if (!currentUser) {
    return <p className="tasks-placeholder">Войдите, чтобы видеть задачи</p>;
  }

  if (isLoading) {
    return <p className="tasks-placeholder">Загружаем задачи…</p>;
  }

  if (error) {
    return <p className="tasks-placeholder error">{error}</p>;
  }

  if (!tasks.length) {
    return <p className="tasks-placeholder">Пока нет задач в работе.</p>;
  }

  return (
    <div className="tasks-container">
      <div className="tasks-filters">
        <div className="tasks-filter-group">
          <label>
            <span>Сортировка:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="deadline-asc">Дедлайн: сначала ближайшие</option>
              <option value="deadline-desc">Дедлайн: сначала далекие</option>
            </select>
          </label>
        </div>

        <div className="tasks-filter-group">
          <label>
            <span>Предмет:</span>
            <select
              value={subjectFilter || ''}
              onChange={(e) =>
                setSubjectFilter(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Все предметы</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tasks-filter-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
            />
            <span>Только мои задачи</span>
          </label>
        </div>
      </div>

      {filteredAndSortedTasks.length === 0 ? (
        <p className="tasks-placeholder">Нет задач, соответствующих фильтрам</p>
      ) : (
        <ul className="tasks-list">
          {filteredAndSortedTasks.map((task) => (
            <li key={task.id} className="task-row">
              <div>
                <p className="task-title">{task.title}</p>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                {task.team?.subject && (
                  <p className="task-subject">Предмет: {task.team.subject.title}</p>
                )}
              </div>
              <div className="task-meta">
                <span className={task.isCompleted ? 'badge success' : 'badge pending'}>
                  {task.isCompleted ? 'Завершена' : 'В работе'}
                </span>
                <span className="task-deadline">
                  {task.deadline
                    ? `До ${new Date(task.deadline).toLocaleDateString('ru-RU')}`
                    : 'Без дедлайна'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
