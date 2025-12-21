import { useMemo, useState, useRef } from 'react';
import type { TeamDetailsResponse } from '../api/teams';
import type { AuthUser } from './AuthBar';
import './TeamDetails.css';

type SortMode = 'created' | 'availability';

interface TeamDetailsProps {
  team: TeamDetailsResponse;
  currentUser: AuthUser;
  onCreateTask(payload: {
    title: string;
    description?: string;
    assigneeIds: number[];
    deadline?: string;
    dependencyIds?: number[];
  }): Promise<void>;
  onToggleTask(taskId: number, isCompleted: boolean): Promise<void>;
  onClose(): void;
}

export function TeamDetails({
  team,
  currentUser,
  onCreateTask,
  onToggleTask,
  onClose,
}: TeamDetailsProps) {
  const [selectedTask, setSelectedTask] = useState<
    TeamDetailsResponse['tasks'][number] | null
  >(null);
  const [comments, setComments] = useState<Record<number, { id: string; text: string; author: string; createdAt: string }[]>>({});
  const [files, setFiles] = useState<Record<number, File[]>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignees, setAssignees] = useState<number[]>([]);
  const [dependencies, setDependencies] = useState<number[]>([]);
  const [showAssignees, setShowAssignees] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('created');

  const enrichedTasks = useMemo(() => {
    return team.tasks.map((task) => {
      const isAvailable =
        task.dependencies.length === 0 ||
        task.dependencies.every((dep) => dep.isCompleted);
      return { ...task, isAvailable };
    });
  }, [team.tasks]);

  const sortedTasks = useMemo(() => {
    const base = [...enrichedTasks];
    if (sortMode === 'created') {
      return base.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return base.sort((a, b) => {
      if (a.isAvailable === b.isAvailable) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.isAvailable ? -1 : 1;
    });
  }, [enrichedTasks, sortMode]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setAssignees([]);
    setDependencies([]);
    setError(null);
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Название обязательно');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // if no assignees chosen, default to all members
      const assigneeIds = assignees.length ? assignees : team.members.map((m) => m.id);
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        assigneeIds,
        dependencyIds: dependencies,
      });
      resetForm();
    } catch (err) {
      console.error(err);
      setError('Не удалось создать задачу, попробуй ещё раз');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignee = (memberId: number) => {
    setAssignees((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const toggleDependency = (taskId: number) => {
    setDependencies((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const closePopovers = () => {
    setShowAssignees(false);
    setShowDependencies(false);
    setShowDeadlinePicker(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(team.joinCode);
      setCopyStatus('Код скопирован');
    } catch (err) {
      console.error(err);
      setCopyStatus('Не удалось скопировать');
    } finally {
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const canManageTasks = team.isAdmin;

  const canToggleTask = (taskId: number) => {
    if (team.isAdmin) return true;
    const task = team.tasks.find((t) => t.id === taskId);
    return task?.assignees.some((assignee) => assignee.id === currentUser.id);
  };

  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    if (!canToggleTask(taskId)) return;
    try {
      await onToggleTask(taskId, isCompleted);
    } catch (err) {
      console.error(err);
      setError('Не удалось обновить задачу');
    }
  };

  const openTaskDetails = (taskId: number) => {
    const t = team.tasks.find((x) => x.id === taskId) ?? null;
    setSelectedTask(t);
  };

  const handleAddComment = (taskId: number, text: string) => {
    if (!text.trim()) return;
    const newComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: text.trim(),
      author: currentUser.name ?? 'Anonymous',
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => ({ ...(prev || {}), [taskId]: [...(prev[taskId] || []), newComment] }));
  };

  const handleAttachFiles = (taskId: number, fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setFiles((prev) => ({ ...(prev || {}), [taskId]: [...(prev[taskId] || []), ...arr] }));
  };

  return (
    <section className="team-details">
      <header className="team-details__header">
        <div>
          <p className="eyebrow">Команда</p>
          <h2>{team.name}</h2>
          <p className="team-details__subject">
            {team.subject.title}
            {team.subject.deadline &&
              ` · Дедлайн: ${new Date(team.subject.deadline).toLocaleDateString('ru-RU')}`}
          </p>
        </div>
        <div className="team-details__actions">
          <button type="button" className="ghost small" onClick={handleCopyCode}>
            Код: {team.joinCode}
          </button>
          <button type="button" className="ghost small" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </header>
      {copyStatus && <p className="copy-status">{copyStatus}</p>}

      <div className="team-details__grid">
        <aside className="team-details__members">
          <h3>Участники</h3>
          <ul>
            {team.members.map((member) => (
              <li key={member.id}>
                <span>{member.name}</span>
                <span className={`role-badge ${member.role}`}>
                  {member.role === 'admin' ? 'Админ' : 'Участник'}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="team-details__tasks">
          <div className="team-details__tasks-header">
            <h3>Задачи</h3>
            <div className="sort-toggle">
              <button
                type="button"
                className={sortMode === 'created' ? 'active' : ''}
                onClick={() => setSortMode('created')}
              >
                По дате
              </button>
              <button
                type="button"
                className={sortMode === 'availability' ? 'active' : ''}
                onClick={() => setSortMode('availability')}
              >
                Доступные сначала
              </button>
            </div>
          </div>

          {canManageTasks && (
            <form className="task-form" onSubmit={(e) => { e.stopPropagation(); handleCreateTask(e); }}>
              <div className="task-input-wrapper">
                <div className="task-input">
                  <input
                    ref={inputRef}
                    placeholder="Добавить задачу — введите название, затем нажмите Enter"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onFocus={closePopovers}
                    aria-label="Название задачи"
                  />
                  <div className="task-input__icons">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Ответственные"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAssignees((s) => !s); setShowDependencies(false); setShowDeadlinePicker(false); }}
                    >
                      👥
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Зависимости"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDependencies((s) => !s); setShowAssignees(false); setShowDeadlinePicker(false); }}
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Дедлайн"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeadlinePicker((s) => !s); setShowAssignees(false); setShowDependencies(false); }}
                    >
                      📅
                    </button>
                    <button type="submit" className="icon-btn" title="Добавить">
                      ➕
                    </button>
                  </div>
                </div>

                {showAssignees && (
                  <div className="popover" style={{ right: 0, top: '48px' }} onMouseLeave={() => setShowAssignees(false)}>
                    <strong>Ответственные</strong>
                    <div className="list">
                      {team.members.map((member) => (
                        <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <input type="checkbox" checked={assignees.includes(member.id)} onChange={() => toggleAssignee(member.id)} />
                          <span>{member.name}</span>
                        </label>
                      ))}
                      <div style={{ marginTop: 8 }} className="muted">Если не выбрать — ответственными будут все</div>
                    </div>
                  </div>
                )}

                {showDependencies && (
                  <div className="popover" style={{ right: 44, top: '48px' }} onMouseLeave={() => setShowDependencies(false)}>
                    <strong>Зависимости</strong>
                    <div className="list">
                      {team.tasks.length === 0 && <div className="muted">Пока нет задач</div>}
                      {team.tasks.map((task) => (
                        <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <input type="checkbox" checked={dependencies.includes(task.id)} onChange={() => toggleDependency(task.id)} />
                          <span>{task.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {showDeadlinePicker && (
                  <div className="popover" style={{ right: 92, top: '48px' }} onMouseLeave={() => setShowDeadlinePicker(false)}>
                    <strong>Дедлайн</strong>
                    <div style={{ marginTop: 8 }}>
                      <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {description && (
                <label>
                  Описание
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
                </label>
              )}

              {error && <p className="form-error">{error}</p>}
            </form>
          )}

          <ul className="tasks-list detailed">
            {sortedTasks.map((task) => (
              <li
                key={task.id}
                className={`task-card ${task.isCompleted ? 'completed' : ''}`}
                onClick={() => openTaskDetails(task.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openTaskDetails(task.id);
                }}
              >
                <div className="task-card__main">
                  <div>
                    <p className="task-title">
                      {task.title}
                      <span className={`badge ${task.isAvailable ? 'success' : 'pending'}`}>
                        {task.isAvailable ? 'Доступна' : 'Ждет зависимостей'}
                      </span>
                    </p>
                    {task.description && <p className="task-description">{task.description}</p>}
                    {task.deadline && (
                      <p className="task-meta">
                        Дедлайн: {new Date(task.deadline).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                  {canToggleTask(task.id) && (
                    <button
                      type="button"
                      className="ghost small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id, !task.isCompleted);
                      }}
                    >
                      {task.isCompleted ? 'Вернуть в работу' : 'Отметить готовой'}
                    </button>
                  )}
                </div>
                <div className="task-card__meta">
                  <div>
                    <p>Ответственные</p>
                    <ul>
                      {task.assignees.length ? (
                        task.assignees.map((assignee) => <li key={assignee.id}>{assignee.name}</li>)
                      ) : (
                        <li className="muted">Не назначены</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p>Зависимости</p>
                    <ul>
                      {task.dependencies.length ? (
                        task.dependencies.map((dep) => (
                          <li key={dep.id}>{dep.title}</li>
                        ))
                      ) : (
                        <li className="muted">Нет</li>
                      )}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {selectedTask && (
            <div className="app-modal" role="dialog" aria-modal="true">
              <div className="app-modal-card">
                <h3>{selectedTask.title}</h3>
                {selectedTask.description && <p>{selectedTask.description}</p>}
                <p className="muted">Задача #{selectedTask.id}</p>

                <section>
                  <h4>Комментарии</h4>
                  <ul className="comments-list">
                    {(comments[selectedTask.id] || []).map((c) => (
                      <li key={c.id}>
                        <strong>{c.author}</strong> <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
                        <p>{c.text}</p>
                      </li>
                    ))}
                    {!comments[selectedTask.id] && <li className="muted">Пока нет комментариев</li>}
                  </ul>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const el = (e.target as HTMLFormElement).elements.namedItem('comment') as HTMLInputElement;
                      handleAddComment(selectedTask.id, el.value);
                      el.value = '';
                    }}
                  >
                    <label>
                      Оставить комментарий
                      <input name="comment" />
                    </label>
                    <div className="app-modal-actions">
                      <button type="button" className="ghost" onClick={() => setSelectedTask(null)}>
                        Закрыть
                      </button>
                      <button type="submit" className="primary">
                        Отправить
                      </button>
                    </div>
                  </form>
                </section>

                <section>
                  <h4>Файлы</h4>
                  <ul>
                    {(files[selectedTask.id] || []).map((f, i) => (
                      <li key={`${f.name}-${i}`}>{f.name} · {(f.size / 1024).toFixed(1)}KB</li>
                    ))}
                    {!files[selectedTask.id] && <li className="muted">Нет загруженных файлов</li>}
                  </ul>
                  <label className="file-input">
                    Прикрепить файл
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleAttachFiles(selectedTask.id, e.target.files)}
                    />
                  </label>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

