import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// 클래스 컴포넌트 예외: React 에러 바운더리(getDerivedStateFromError/componentDidCatch)는
// 함수형 컴포넌트로 구현할 수 없는 유일한 케이스라 CONVENTIONS.md의 "함수형 컴포넌트만" 규칙에서 벗어난다.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 별도 에러 리포팅 서비스 없이 콘솔 로그만 남긴다 (과설계 지양).
    console.error(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-700">문제가 발생했습니다. 새로고침해 주세요.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              새로고침
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
