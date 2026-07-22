interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Ocorreu um erro ao carregar os dados.', onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-state-icon">😕</div>
      <h3 className="error-state-title">Algo deu errado</h3>
      <p className="error-state-text">{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}
