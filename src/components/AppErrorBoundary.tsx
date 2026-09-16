import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { err: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('Usil render failed', err, info.componentStack);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-paper text-navy" dir="rtl">
        <div className="max-w-md w-full rounded-2xl border border-line bg-white p-6 space-y-3 text-right">
          <p className="text-lg font-bold">تعذّر عرض الصفحة</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            الصفحة فتحت ثم توقفت. حدّث الشاشة. إن تكررت، امسح بيانات الموقع ليوصل ثم افتح من جديد.
          </p>
          <button
            type="button"
            className="w-full h-11 rounded-xl bg-action text-white text-sm font-bold"
            onClick={() => window.location.reload()}
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }
}

type DashboardProps = {
  children: ReactNode;
  onReset: () => void;
};

/** If admin/vendor studio throws, return to the marketplace instead of logging the user out. */
export class DashboardErrorBoundary extends Component<DashboardProps, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('Usil dashboard failed', err, info.componentStack);
    this.props.onReset();
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <main className="flex-1 container mx-auto px-3 py-10" dir="rtl">
        <div className="max-w-md mx-auto rounded-2xl border border-line bg-white p-6 space-y-3 text-right">
          <p className="text-lg font-bold text-navy">تعذّر فتح اللوحة</p>
          <p className="text-sm text-slate-600 leading-relaxed">حسابك ما زال داخل. نرجعك للسوق.</p>
          <button
            type="button"
            className="w-full h-11 rounded-xl bg-action text-white text-sm font-bold"
            onClick={() => {
              this.setState({ err: null });
              this.props.onReset();
            }}
          >
            ارجع للسوق
          </button>
        </div>
      </main>
    );
  }
}
