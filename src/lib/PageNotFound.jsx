import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-black text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">Страница не найдена</p>
        <Link to="/" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors mx-auto w-fit">
          <Home className="w-4 h-4" />
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
