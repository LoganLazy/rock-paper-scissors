/**
 * React 错误边界组件
 */
import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="card">
            <h2>出错了</h2>
            <p>应用遇到了一个错误，请刷新页面重试。</p>
            <button className="primary" onClick={() => window.location.reload()}>
              刷新页面
            </button>
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary>错误详情</summary>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
