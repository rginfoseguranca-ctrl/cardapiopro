import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | string)[] = []
  const delta = 2

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap' }}>
      <button
        className="btn btn-outline btn-sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Anterior
      </button>

      {pages.map((page, i) =>
        typeof page === 'string' ? (
          <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text-light)' }}>...</span>
        ) : (
          <button
            key={page}
            className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        )
      )}

      <button
        className="btn btn-outline btn-sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próxima →
      </button>

      <span style={{ fontSize: '.75rem', color: 'var(--text-light)', marginLeft: 8 }}>
        Página {currentPage} de {totalPages}
      </span>
    </div>
  )
}
