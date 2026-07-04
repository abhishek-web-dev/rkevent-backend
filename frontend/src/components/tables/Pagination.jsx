import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';

const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
      <p className="text-xs text-slate-400">
        Page <span className="font-semibold text-white">{page}</span> of{' '}
        <span className="font-semibold text-white">{pages}</span>
      </p>

      <div className="flex space-x-2">
        <Button
          variant="glass"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl px-2.5"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="glass"
          size="sm"
          disabled={page === pages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl px-2.5"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
