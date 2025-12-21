import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import './Tasks.css';

interface Task {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  isCompleted: boolean;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Task[]>('/tasks')
      .then((res) => setTasks(res.data))
      .catch(() => setError('Не удалось получить задачи'))
      .finally(() => setIsLoading(false));
  }, []);

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
    <ul className="tasks-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-row">
          <div>
            <p className="task-title">{task.title}</p>
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
          </div>
          <div className="task-meta">
            <span className={task.isCompleted ? 'badge success' : 'badge pending'}>
              {task.isCompleted ? 'Завершена' : 'В работе'}
            </span>
            <span className="task-deadline">
              {task.deadline ? `До ${new Date(task.deadline).toLocaleDateString('ru-RU')}` : 'Без дедлайна'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}