import { Component } from 'react'
import { Link } from 'react-router-dom'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          color: '#64748b',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.25rem',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '0.75rem',
            }}
          >
            Reload Page
          </button>
          <Link
            to="/"
            style={{
              padding: '0.5rem 1.25rem',
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Go Home
          </Link>
        </div>
      )
    }
    return this.props.children
  }
}
