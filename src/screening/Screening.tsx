import { Check, Info } from 'lucide-react'
import { Button, Checkbox, Form, ProgressBar, Radio, RadioGroup } from 'react-aria-components'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router'
import screening from './questions.json'
import './screening.css'

const confirmation = 'Я понимаю, что это не медицинская услуга и не диагноз'
const booleanChoices = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
] as const
const questions = screening.blocks.flatMap(block => block.questions.map(question => ({
  code: question.code,
  text: question.text,
  required: question.required,
  choices: ('options' in question ? question.options : undefined) ?? booleanChoices,
  interrupts: block.interrupt === true && 'red_flag' in question && question.red_flag === true,
})))

type Question = (typeof questions)[number]

export type ScreeningDraft = {
  accepted: boolean
  answers: Partial<Record<string, string>>
}

export const emptyScreeningDraft: ScreeningDraft = { accepted: false, answers: {} }

type ScreeningProps = {
  title: string
  disclaimer: string
  draft: ScreeningDraft
  onDraftChange: (draft: ScreeningDraft) => void
}

function questionPath(index: number) {
  return index === 0 ? '/screening/question' : `/screening/question/${index + 1}`
}

function firstUnanswered(draft: ScreeningDraft) {
  return questions.findIndex(question => question.required && !draft.answers[question.code])
}

function shouldInterrupt(question: Question, draft: ScreeningDraft) {
  return question.interrupts && draft.answers[question.code] === 'yes'
}

function Notice({ children }: { children: string }) {
  return (
    <p className="screening-notice">
      <Info size={20} aria-hidden="true" />
      {children}
    </p>
  )
}

function Introduction({ disclaimer, draft, onDraftChange }: Omit<ScreeningProps, 'title'>) {
  const navigate = useNavigate()
  return (
    <>
      <h2>Перед началом</h2>
      <p className="screening-description">Анкета поможет описать симптомы, чтобы обсудить их с врачом. В учебной версии доступна часть анкеты.</p>
      <Notice>{disclaimer}</Notice>
      <Checkbox
        className="screening-consent"
        isSelected={draft.accepted}
        onChange={accepted => onDraftChange(accepted ? { ...draft, accepted } : emptyScreeningDraft)}
        isRequired
      >
        <span className="checkbox-mark" aria-hidden="true"><Check size={16} strokeWidth={2.5} /></span>
        {confirmation}
      </Checkbox>
      <div className="screening-actions">
        <Button className="action-link primary" isDisabled={!draft.accepted} onPress={() => navigate(questionPath(0))}>
          Начать анкету
        </Button>
      </div>
    </>
  )
}

function QuestionStep({ disclaimer, draft, onDraftChange }: Omit<ScreeningProps, 'title'>) {
  const navigate = useNavigate()
  const { step } = useParams()
  const index = step === undefined ? 0 : questions.findIndex((_, position) => step === String(position + 1))
  const question = questions[index]

  if (!draft.accepted || !question) return <Navigate to="/screening" replace />

  const missing = firstUnanswered(draft)
  if (missing !== -1 && index > missing) return <Navigate to={questionPath(missing)} replace />

  const answer = draft.answers[question.code] ?? null
  const position = index + 1
  const isLast = position === questions.length
  const back = index === 0 ? '/screening' : questionPath(index - 1)

  return (
    <>
      <ProgressBar
        className="question-progress"
        aria-label="Прогресс анкеты"
        value={position}
        maxValue={questions.length}
        valueLabel={`Вопрос ${position} из ${questions.length}`}
      >
        {({ percentage, valueText }) => (
          <>
            <span aria-hidden="true">{valueText}</span>
            <span className="progress-track" aria-hidden="true">
              <span style={{ width: `${percentage}%` }} />
            </span>
          </>
        )}
      </ProgressBar>
      <h2 id="screening-step-heading" tabIndex={-1}>{question.text}</h2>
      <Form key={question.code} onSubmit={event => {
        event.preventDefault()
        if (question.required && !answer) return
        navigate(isLast || shouldInterrupt(question, draft) ? '/screening/finish' : questionPath(position))
      }}>
        <RadioGroup
          aria-labelledby="screening-step-heading"
          className="question-options"
          name={question.code}
          isRequired={question.required}
          value={answer}
          onChange={value => {
            onDraftChange({ ...draft, answers: { ...draft.answers, [question.code]: value } })
          }}
        >
          {question.choices.map(({ value, label }) => (
            <Radio className="question-option" key={value} value={value}>
              <span className="radio-mark" aria-hidden="true" />
              {label}
            </Radio>
          ))}
        </RadioGroup>
        <Notice>{disclaimer}</Notice>
        <div className="screening-actions">
          <Link className="action-link" to={back}>{index === 0 ? 'К вступлению' : 'Назад'}</Link>
          <Button className="action-link primary" type="submit" isDisabled={question.required && !answer}>
            {isLast ? 'Завершить демо' : 'Далее'}
          </Button>
        </div>
      </Form>
    </>
  )
}

function Finish({ draft }: Pick<ScreeningProps, 'draft'>) {
  if (!draft.accepted) return <Navigate to="/screening" replace />

  const interruptedAt = questions.findIndex(question => shouldInterrupt(question, draft))
  const missing = firstUnanswered(draft)
  if (interruptedAt === -1 && missing !== -1) return <Navigate to={questionPath(missing)} replace />

  const interrupted = interruptedAt !== -1
  const back = questionPath(interrupted ? interruptedAt : questions.length - 1)
  return (
    <>
      <h2 id="screening-step-heading" tabIndex={-1}>{interrupted ? 'Анкета остановлена' : 'Вы ответили на все вопросы'}</h2>
      <p className="screening-description">
        {interrupted
          ? 'Если вы случайно выбрали «Да», вернитесь к вопросу и измените ответ.'
          : 'При необходимости можно вернуться и изменить ответы.'}
      </p>
      <Notice>{interrupted
        ? 'Это учебная версия. Она не определяет, насколько срочно нужна медицинская помощь.'
        : 'Это учебная версия. Она не оценивает состояние здоровья.'}</Notice>
      <div className="screening-actions">
        <Link className="action-link" to={back}>Вернуться к вопросу</Link>
        <Link className="action-link primary" to="/">На главную</Link>
      </div>
    </>
  )
}

export function Screening({ title, ...screenProps }: ScreeningProps) {
  return (
    <div className="content-width page">
      <h1>{title}</h1>
      <div className="surface screening-panel">
        <Routes>
          <Route index element={<Introduction {...screenProps} />} />
          <Route path="question/:step?" element={<QuestionStep {...screenProps} />} />
          <Route path="finish" element={<Finish draft={screenProps.draft} />} />
          <Route path="*" element={<Navigate to="/screening" replace />} />
        </Routes>
      </div>
    </div>
  )
}
