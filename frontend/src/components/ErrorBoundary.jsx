import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Ứng dụng đã gặp lỗi không mong muốn.',
    };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-100 rounded-2xl shadow-xl p-6 space-y-4">
            <h1 className="text-lg font-semibold text-gray-900">Đã xảy ra lỗi</h1>
            <p className="text-sm text-gray-600">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
