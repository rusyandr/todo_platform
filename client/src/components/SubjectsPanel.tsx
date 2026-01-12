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
  onLeaveSubject?: (subjectId: number) => void;
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
  onLeaveSubject,
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
            style={{ position: 'relative' }}
          >
            {onLeaveSubject && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const message = subject.authorName && subject.authorName !== '—'
                    ? 'Вы создатель этого предмета. Выход приведет к удалению предмета и всех команд. Продолжить?'
                    : 'Вы уверены, что хотите выйти из предмета?';
                  if (confirm(message)) {
                    onLeaveSubject(subject.id);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#ef4444',
                  padding: '4px',
                  lineHeight: '1',
                }}
                title="Выйти из предмета"
              >
                ×
              </button>
            )}
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


