import { Link } from "react-router-dom";
import { ArrowRight, Images, Layers, Package, Plus, Sparkles, Star } from "lucide-react";
import { dashboard } from "@/api/endpoints";
import { PageHeader } from "@/components/layout/AdminLayout";
import { Badge, Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import { formatDate } from "@/utils/format";

/**
 * Every figure here is a real count from the database. Nothing is estimated,
 * projected, or invented to fill a card — if a number is not something the
 * system actually knows, it is not shown.
 */
export function DashboardPage() {
  const { data, loading, error, reload } = useAsync((signal) => dashboard.get({ signal }), []);

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="An overview of what is live on the website." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="card p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <Skeleton className="h-4 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="card p-5">
            <Skeleton className="h-4 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <Card>
          <ErrorState message={error ?? "Could not load the dashboard."} onRetry={reload} />
        </Card>
      </>
    );
  }

  const { totals, recentProducts, recentCollections } = data;

  const stats = [
    {
      label: "Active products",
      value: totals.activeProducts,
      note:
        totals.inactiveProducts > 0
          ? `${totals.inactiveProducts} hidden`
          : "All products visible",
      Icon: Package,
      to: "/products",
    },
    {
      label: "Collections",
      value: totals.collections,
      note: `${totals.activeCollections} active`,
      Icon: Layers,
      to: "/collections",
    },
    {
      label: "New arrivals",
      value: totals.newArrivals,
      note: "Shown on /new-arrivals",
      Icon: Sparkles,
      to: "/products?newArrivals=true",
    },
    {
      label: "Gallery items",
      value: totals.galleryItems,
      note: "Live on /gallery",
      Icon: Images,
      to: "/gallery",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of what is live on the website right now."
        action={
          <>
            <Link to="/products/new">
              <Button size="sm">
                <Plus aria-hidden className="h-4 w-4" /> New product
              </Button>
            </Link>
            <Link to="/collections/new">
              <Button variant="secondary" size="sm">
                New collection
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="card group p-5 transition-colors hover:border-accent-line hover:bg-accent-soft/40"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[0.8125rem] font-medium text-ink-2">{label}</p>
              <Icon aria-hidden className="h-4 w-4 shrink-0 text-ink-3" />
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-ink-3">{note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Recently updated products"
          description="The last pieces anyone edited."
          bodyClassName="p-0"
          action={
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-accent hover:underline"
            >
              All products <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recentProducts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-2">No products yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/products/${product.id}/edit`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {product.collectionName ?? "No collection"}
                      </span>
                    </span>
                    {!product.isActive ? <Badge tone="warning">Hidden</Badge> : null}
                    <span className="shrink-0 text-xs text-ink-3">
                      {formatDate(product.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recently updated collections"
          description="Counters and how many pieces sit in each."
          bodyClassName="p-0"
          action={
            <Link
              to="/collections"
              className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-accent hover:underline"
            >
              All collections <ArrowRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recentCollections.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-2">No collections yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentCollections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    to={`/collections/${collection.id}/edit`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {collection.name}
                      </span>
                      <span className="block truncate text-xs text-ink-3">
                        {collection.productCount}{" "}
                        {collection.productCount === 1 ? "product" : "products"}
                      </span>
                    </span>
                    {!collection.isActive ? <Badge tone="warning">Hidden</Badge> : null}
                    <span className="shrink-0 text-xs text-ink-3">
                      {formatDate(collection.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6" title="Featured on the home page">
        <p className="flex items-center gap-2 text-sm text-ink-2">
          <Star aria-hidden className="h-4 w-4 text-accent" />
          {totals.featuredProducts} {totals.featuredProducts === 1 ? "product is" : "products are"}{" "}
          marked as featured and appear in the home page grid.
        </p>
      </Card>
    </>
  );
}
