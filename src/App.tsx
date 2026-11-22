import { useEffect, useState, type ReactNode } from 'react'
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  HeartPulse,
  LayoutGrid,
  NotebookPen,
} from 'lucide-react'
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router'
import libraryImage from './assets/library.webp'
import { emptyScreeningDraft, Screening } from './screening/Screening'

const pages = {
  '/': 'Обзор',
  '/screening': 'Скрининговая анкета',
  '/screening/finish': 'Завершение анкеты',
  '/account': 'Личный кабинет',
  '/library': 'Библиотека знаний',
  '/privacy': 'Политика конфиденциальности',
  '/terms': 'Пользовательское соглашение',
} as const

const navigation = [
  { to: '/', label: 'Обзор', icon: LayoutGrid },
  { to: '/screening', label: 'Анкета', icon: ClipboardList },
  { to: '/account', label: 'Кабинет', icon: NotebookPen },
  { to: '/library', label: 'Библиотека', icon: BookOpen },
] as const

const disclaimer = 'Сервис носит информационный характер. Он не ставит диагноз и не заменяет консультацию врача.'

function Header() {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark"><HeartPulse size={19} aria-hidden="true" /></span>
        РевмаПуть
      </Link>
      <Link className="help-link" to="/#how">
        <CircleHelp size={19} aria-hidden="true" />
        Справка
      </Link>
    </header>
  )
}

function Navigation() {
  return (
    <nav className="app-navigation" aria-label="Разделы сервиса">
      <ul>
        {navigation.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to !== '/screening'}>
              <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Guide() {
  const { hash, key } = useLocation()
  const [isExpanded, setExpanded] = useState(true)

  useEffect(() => {
    if (hash === '#how') setExpanded(true)
  }, [hash, key])

  return (
    <aside className="surface support" aria-label="Справка">
      <Disclosure isExpanded={isExpanded} onExpandedChange={setExpanded}>
        <h2 id="how" tabIndex={-1}>
          <Button slot="trigger" className="guide-trigger">
            Как это работает
            <ChevronDown size={19} aria-hidden="true" />
          </Button>
        </h2>
        <DisclosurePanel className="guide-panel">
          <ol>
            <li>Ответить на вопросы анкеты.</li>
            <li>Увидеть уровень настороженности.</li>
            <li>Сохранить результат для обсуждения с врачом.</li>
          </ol>
        </DisclosurePanel>
      </Disclosure>
      <section className="medical-review" aria-labelledby="council-title">
        <h2 id="council-title">Медицинский совет</h2>
        <p>Курирующий врач проверяет вопросы и статьи перед публикацией.</p>
      </section>
      <Disclosure className="service-info">
        <h2>
          <Button slot="trigger" className="guide-trigger">
            О сервисе
            <ChevronDown size={19} aria-hidden="true" />
          </Button>
        </h2>
        <DisclosurePanel>
          <div className="service-info-content">
            <p>{disclaimer}</p>
            <nav aria-label="Правовая информация">
              <Link className="text-link" to="/privacy">{pages['/privacy']}</Link>
              <Link className="text-link" to="/terms">{pages['/terms']}</Link>
            </nav>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </aside>
  )
}

function Home() {
  return (
    <div className="content-width page">
      <h1>{pages['/']}</h1>
      <div className="overview">
        <div className="overview-main">
          <section className="surface action-list" aria-label="Основные действия">
            <article className="action-row">
              <div className="action-description">
                <span className="section-mark"><ClipboardList size={24} strokeWidth={1.7} aria-hidden="true" /></span>
                <div>
                  <h2>Анкета симптомов</h2>
                  <p>Если вас беспокоят симптомы.</p>
                </div>
              </div>
              <Link className="action-link primary" to="/screening">Открыть анкету</Link>
            </article>
            <article className="action-row">
              <div className="action-description">
                <span className="section-mark mark-neutral"><NotebookPen size={24} strokeWidth={1.7} aria-hidden="true" /></span>
                <div>
                  <h2>Личный кабинет</h2>
                  <p>Дневник для тех, кому уже поставили диагноз.</p>
                </div>
              </div>
              <Link className="action-link" to="/account">Открыть кабинет</Link>
            </article>
          </section>
          <section className="surface library-preview" aria-labelledby="library-preview-title">
            <div>
              <h2 id="library-preview-title">Библиотека знаний</h2>
              <p>Темы по ревматологии. Статьи готовятся.</p>
              <Link className="text-link" to="/library">Открыть библиотеку</Link>
            </div>
            <img src={libraryImage} alt="" width="420" height="315" />
          </section>
        </div>
        <Guide />
      </div>
    </div>
  )
}

function SectionFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="content-width page">
      <h1>{title}</h1>
      <div className="surface section-content">{children}</div>
    </div>
  )
}

function Account() {
  return (
    <SectionFrame title={pages['/account']}>
      <h2>Дневник симптомов</h2>
      <p>Дневник и журнал приёма препаратов появятся в следующих версиях.</p>
    </SectionFrame>
  )
}

function Library() {
  return (
    <SectionFrame title={pages['/library']}>
      <h2>Запланированные темы</h2>
      <p>Статьи появятся после медицинского рецензирования.</p>
      <ul className="topics">
        <li>Ревматоидный артрит</li>
        <li>Подагра</li>
        <li>Системная красная волчанка</li>
        <li>Спондилоартрит</li>
      </ul>
    </SectionFrame>
  )
}

function RouteEffects() {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    const pagePath = pathname.toLowerCase().replace(/\/+$/, '') || '/'
    const question = /^\/screening\/question(?:\/(\d+))?$/.exec(pagePath)
    const title = question
      ? `Вопрос ${question[1] ?? 1}`
      : pages[pagePath as keyof typeof pages] ?? 'Страница не найдена'
    document.title = `${title} | РевмаПуть`

    if (hash === '#how') {
      const heading = document.getElementById('how')
      heading?.focus({ preventScroll: true })
      heading?.scrollIntoView({ block: 'start' })
    } else if (key !== 'default') {
      const focusTarget = document.getElementById('screening-step-heading') ?? document.getElementById('main')
      focusTarget?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }, [pathname, hash, key])
  return null
}

export function App() {
  const [screeningDraft, setScreeningDraft] = useState(emptyScreeningDraft)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Перейти к содержанию</a>
      <Header />
      <Navigation />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/screening/*" element={
            <Screening title={pages['/screening']} disclaimer={disclaimer} draft={screeningDraft} onDraftChange={setScreeningDraft} />
          } />
          <Route path="/account" element={<Account />} />
          <Route path="/library" element={<Library />} />
          <Route path="/privacy" element={
            <SectionFrame title={pages['/privacy']}>
              <p>В этом прототипе нет форм для сбора персональных данных или сведений о здоровье. Политика будет опубликована до подключения этих функций.</p>
            </SectionFrame>
          } />
          <Route path="/terms" element={
            <SectionFrame title={pages['/terms']}>
              <p>Пользовательское соглашение будет опубликовано перед запуском сервиса.</p>
            </SectionFrame>
          } />
          <Route path="*" element={
            <SectionFrame title="Страница не найдена">
              <Link className="text-link" to="/">Вернуться к обзору</Link>
            </SectionFrame>
          } />
        </Routes>
      </main>
      <RouteEffects />
    </div>
  )
}
