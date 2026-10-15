interface PaginationProps {
  /** zero-based */
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function Pagination({ page, size, totalPages, totalElements, onPageChange, onSizeChange }: PaginationProps) {
  const firstRow = totalElements === 0 ? 0 : page * size + 1;
  const lastRow = Math.min((page + 1) * size, totalElements);

  return (
    <nav className="pagination" aria-label="Employee list pages">
      <p className="pagination__summary" aria-live="polite">
        Showing {firstRow}–{lastRow} of {totalElements}
      </p>
      <div className="pagination__controls">
        <label className="pagination__size">
          Rows per page
          <select value={size} onChange={(event) => onSizeChange(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <button type="button" className="button button--secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 0}>
          Previous
        </button>
        <span className="pagination__position">
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
