import './SubjectsPanel.css';

export type SubjectCard = {
  id: number;
  title: string;
  description: string;
  teamCount: number;
  joinCode?: string;
  authorName?: string;
  deadlineLabel?: string;
};

interface SubjectsPanelProps {
  subjects: SubjectCard[];
  onAddSubject?: () => void;
  onEnterCode?: () => void;
  onSelectSubject?: (subject: SubjectCard) => void;
  canCreate?: boolean;
  canJoin?: boolean;
  actionDisabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export function SubjectsPanel({
  subjects,
  onAddSubject,
  onEnterCode,
  onSelectSubject,
  canCreate,
  canJoin,
  actionDisabled,
  isLoading,
  error,
}: SubjectsPanelProps) {
  const renderContent = () => {
    if (isLoading) {
      return <p className="panel-placeholder">Загружаем список предметов…</p>;
    }

    if (error) {
      return <p className="panel-placeholder error">{error}</p>;
    }

    if (!subjects.length) {
      return (
        <p className="panel-placeholder">
          Пока нет предметов. Добавь первый, чтобы сформировать команды.
        </p>
      );
    }

    return (
      <ul className="subjects-list">
        {subjects.map((subject) => (
          <li
            key={subject.id}
            className={`subject-card ${onSelectSubject ? 'selectable' : ''}`}
            onClick={onSelectSubject ? () => onSelectSubject(subject) : undefined}
            onKeyDown={
              onSelectSubject
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectSubject(subject);
                    }
                  }
                : undefined
            }
            role={onSelectSubject ? 'button' : undefined}
            tabIndex={onSelectSubject ? 0 : undefined}
          >
            <div>
              <p className="subject-title">{subject.title}</p>
              <p className="subject-description">{subject.description}</p>
            </div>
            <div className="subject-meta">
              <span>{subject.teamCount} команд(ы)</span>
              {subject.deadlineLabel && (
                <span className="deadline">Дедлайн: {subject.deadlineLabel}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="panel subjects-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Предметы</p>
          <h2>Текущие дисциплины</h2>
        </div>
        <div className="panel-actions">
          {onAddSubject && canCreate && (
            <button
              type="button"
              className="ghost small"
              onClick={onAddSubject}
              disabled={actionDisabled}
            >
              Добавить
            </button>
          )}
          {onEnterCode && canJoin && (
            <button type="button" className="ghost small" onClick={onEnterCode}>
              Ввести код
            </button>
          )}
        </div>
      </div>

      {renderContent()}
    </section>
  );
}


