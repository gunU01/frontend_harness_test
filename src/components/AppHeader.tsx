import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const navItems = [
  { to: '/specs', label: '스펙 목록' },
  { to: '/specs/new', label: '템플릿' },
  { to: '/community', label: '커뮤니티' },
  { to: '/settings', label: '설정' },
]

export function AppHeader() {
  const location = useLocation()

  return (
    <header className="sticky top-0 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/specs" className="text-sm font-bold text-slate-900">
          PRD 작성 도구
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  isActive
                    ? 'text-sm text-primary-600 font-medium'
                    : 'text-sm text-slate-600 hover:text-slate-900'
                }
              >
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  )
}
