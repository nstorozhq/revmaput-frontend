import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import './diary.css'

const numericFields = [
  { name: 'stiffness', label: 'Утренняя скованность (минуты)', max: 1440 },
  { name: 'pain', label: 'Боль', max: 10, hint: '0 — нет боли, 10 — самая сильная боль' },
  { name: 'fatigue', label: 'Усталость', max: 10, hint: '0 — нет усталости, 10 — очень сильная усталость' },
  { name: 'swollen', label: 'Число припухших суставов', max: 32767 },
  { name: 'painful', label: 'Число болезненных суставов', max: 32767 },
] as const

type NumericField = (typeof numericFields)[number]['name']

export type DiaryEntry = Record<NumericField, number | null> & {
  date: string
  flare: boolean
  notes: string
}

export type DiaryEntries = Partial<Record<string, DiaryEntry>>

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeZone: 'UTC' })

function localDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

type DiaryProps = {
  title: string
  entries: DiaryEntries
  onSave: (entry: DiaryEntry, previousDate: string | null) => void
}

function DiaryHistory({ entries, onEdit }: {
  entries: DiaryEntries
  onEdit: (entry: DiaryEntry) => void
}) {
  const sorted = Object.values(entries)
    .filter((entry): entry is DiaryEntry => entry !== undefined)
    .sort((first, second) => second.date.localeCompare(first.date))

  return (
    <section className="surface diary-panel" aria-labelledby="diary-history-heading">
      <h2 id="diary-history-heading">История записей</h2>
      {sorted.length === 0 ? (
        <p className="diary-empty">Здесь появятся записи после сохранения.</p>
      ) : (
        <ul className="diary-history" role="list">
          {sorted.map(entry => {
            const formattedDate = dateFormat.format(new Date(`${entry.date}T00:00:00Z`))
            return (
              <li key={entry.date}>
                <details>
                  <summary><time dateTime={entry.date}>{formattedDate}</time></summary>
                  <dl className="diary-entry">
                    {numericFields.map(({ name, label }) => {
                      const value = entry[name]
                      if (value === null) return null
                      return (
                        <div key={name}>
                          <dt>{label}</dt>
                          <dd>{name === 'pain' || name === 'fatigue' ? `${value} из 10` : value}</dd>
                        </div>
                      )
                    })}
                    <div><dt>Обострение</dt><dd>{entry.flare ? 'Да' : 'Нет'}</dd></div>
                  </dl>
                  {entry.notes && (
                    <div className="diary-notes">
                      <h3>Заметки</h3>
                      <p>{entry.notes}</p>
                    </div>
                  )}
                  <button className="action-link" type="button" onClick={() => onEdit(entry)}>
                    Изменить запись
                  </button>
                </details>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function Diary({ title, entries, onSave }: DiaryProps) {
  const [date, setDate] = useState(localDate)
  const [editing, setEditing] = useState<DiaryEntry | null>(null)
  const [status, setStatus] = useState('')
  const formHeading = useRef<HTMLHeadingElement>(null)
  const conflictingEntry = editing?.date !== date ? entries[date] : undefined

  useEffect(() => {
    if (editing) formHeading.current?.focus()
  }, [editing])

  function editEntry(entry: DiaryEntry) {
    setStatus('')
    setEditing(entry)
    setDate(entry.date)
    if (editing === entry) formHeading.current?.focus()
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!date || conflictingEntry) return

    const fields = new FormData(event.currentTarget)
    const readNumber = (name: NumericField) => {
      const value = fields.get(name)
      return typeof value === 'string' && value !== '' ? Number(value) : null
    }
    onSave({
      date,
      pain: readNumber('pain'),
      fatigue: readNumber('fatigue'),
      stiffness: readNumber('stiffness'),
      swollen: readNumber('swollen'),
      painful: readNumber('painful'),
      flare: fields.has('flare'),
      notes: String(fields.get('notes') ?? '').trim(),
    }, editing?.date ?? null)

    event.currentTarget.reset()
    setDate(localDate())
    setStatus(editing ? 'Изменения сохранены.' : 'Запись добавлена в историю.')
    setEditing(null)
  }

  return (
    <div className="content-width page">
      <h1>{title}</h1>
      <div className="diary-heading">
        <h2>Дневник симптомов</h2>
        <p className="diary-notice">
          <Info size={19} aria-hidden="true" />
          <span>Используйте вымышленные данные. Записи исчезнут после обновления вкладки.</span>
        </p>
      </div>
      <div className="diary-layout">
        <section className="surface diary-panel" aria-labelledby="diary-form-heading">
          <h2 id="diary-form-heading" tabIndex={-1} ref={formHeading}>{editing ? 'Изменить запись' : 'Новая запись'}</h2>
          <form className="diary-form" autoComplete="off" onSubmit={saveEntry}>
            <div className="diary-fields" key={editing?.date ?? 'new'}>
              <div className="diary-field">
                <label htmlFor="diary-date">Дата записи</label>
                <input
                  id="diary-date"
                  type="date"
                  min="0001-01-01"
                  max="9999-12-31"
                  required
                  value={date}
                  aria-describedby="diary-date-hint"
                  onChange={event => { setDate(event.target.value); setStatus('') }}
                />
                <p id="diary-date-hint">Одна запись на день.</p>
                {conflictingEntry && (
                  <div className="diary-conflict">
                    <p>За этот день уже есть запись.</p>
                    <button className="action-link" type="button" onClick={() => editEntry(conflictingEntry)}>Открыть запись</button>
                  </div>
                )}
              </div>
              {numericFields.map(field => {
                const id = `diary-${field.name}`
                const defaultValue = editing?.[field.name] ?? ''
                return (
                  <div key={field.name} className="diary-field">
                    <label htmlFor={id}>{field.label}</label>
                    {'hint' in field ? (
                      <>
                        <select id={id} name={field.name} defaultValue={defaultValue} aria-describedby={`${id}-hint`}>
                          <option value="">Не указано</option>
                          {Array.from({ length: field.max + 1 }, (_, number) => (
                            <option key={number} value={number}>{number}</option>
                          ))}
                        </select>
                        <p id={`${id}-hint`}>{field.hint}</p>
                      </>
                    ) : (
                      <input id={id} name={field.name} type="number" inputMode="numeric" min={0} max={field.max} step={1} defaultValue={defaultValue} />
                    )}
                  </div>
                )
              })}
              <label className="diary-checkbox diary-wide">
                <input name="flare" type="checkbox" defaultChecked={editing?.flare ?? false} />
                Было обострение
              </label>
              <div className="diary-field diary-wide">
                <label htmlFor="diary-notes">Заметки</label>
                <textarea id="diary-notes" name="notes" rows={3} spellCheck={false} defaultValue={editing?.notes ?? ''} />
              </div>
            </div>
            <div className="diary-actions">
              <button className="action-link primary" type="submit" disabled={Boolean(conflictingEntry)}>
                {editing ? 'Сохранить изменения' : 'Сохранить запись'}
              </button>
              {editing && (
                <button className="action-link" type="button" onClick={() => {
                  setEditing(null)
                  setDate(localDate())
                  formHeading.current?.focus()
                }}>
                  Отмена
                </button>
              )}
            </div>
            <div className="diary-status" role="status">{status && <p>{status}</p>}</div>
          </form>
        </section>
        <DiaryHistory entries={entries} onEdit={editEntry} />
      </div>
    </div>
  )
}
