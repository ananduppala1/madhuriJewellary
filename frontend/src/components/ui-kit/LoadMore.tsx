import { cn } from "@/lib/utils";
import { ProductCardSkeleton } from "@/components/ui-kit/AsyncStates";

/**
 * The control under a product grid.
 *
 * Paging was added because the collection and new-arrivals pages used to ask
 * for the entire catalogue in one request. The constraint was that the approved
 * grid must not change — so nothing above this component does. Cards are
 * appended, never re-rendered, which is why the visitor's scroll position
 * survives a click: everything they were looking at is still exactly where it
 * was.
 *
 * While a page is loading, the button is replaced by a row of card skeletons of
 * the same dimensions as the real cards. The page grows downward by a
 * predictable amount instead of shifting under the reader's thumb.
 */
export function LoadMore({
  hasMore,
  loading,
  error,
  shown,
  total,
  onLoadMore,
  columns = 3,
  noun = "pieces",
  className,
}: {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  shown: number;
  total: number;
  onLoadMore: () => void;
  columns?: 3 | 4;
  noun?: string;
  className?: string;
}) {
  if (!hasMore && !error) {
    // Nothing more to fetch. The count is still worth stating — it tells the
    // visitor they have reached the end rather than hit a broken button.
    return total > 0 ? (
      <p
        className={cn(
          "mt-10 text-center text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground",
          className,
        )}
      >
        All {total} {noun} shown
      </p>
    ) : null;
  }

  return (
    <div className={cn("mt-10 flex flex-col items-center gap-5", className)}>
      {loading ? (
        <>
          <span role="status" aria-live="polite" className="sr-only">
            Loading more {noun}
          </span>
          <div
            aria-hidden
            className={cn(
              "grid w-full gap-6 sm:grid-cols-2",
              columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4",
            )}
          >
            {Array.from({ length: columns }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </>
      ) : (
        <>
          {error ? (
            <p role="alert" className="text-sm text-muted-foreground">
              {error}
            </p>
          ) : (
            <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
              Showing {shown} of {total} {noun}
            </p>
          )}

          <button
            type="button"
            onClick={onLoadMore}
            className="border border-brand/40 px-7 py-3.5 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:border-brand hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {error ? "Try again" : `Load more ${noun}`}
          </button>
        </>
      )}
    </div>
  );
}
