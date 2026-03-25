export default function UserNotRegisteredError() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="card-glass max-w-lg rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Доступ пока не предоставлен</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ваша учетная запись существует, но еще не подключена к системе.
          Обратитесь к организатору или администратору для получения доступа.
        </p>
      </div>
    </div>
  );
}
