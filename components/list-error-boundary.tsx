"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = {
  children: ReactNode
  label?: string
}

type State = {
  error: Error | null
}

/** Prevents a single render throw from wiping the whole audience board. */
export class ListErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ListErrorBoundary]", this.props.label, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-foreground">
            სია ვერ ჩაიტვირთა
          </p>
          <p className="max-w-md break-words text-xs text-muted-foreground">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => this.setState({ error: null })}
          >
            თავიდან ცდა
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
