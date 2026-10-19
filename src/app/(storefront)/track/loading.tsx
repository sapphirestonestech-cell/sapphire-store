export default function TrackLoading() {
  return (
    <div className="page-width py-8 md:py-12">
      <div className="mx-auto max-w-2xl animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-9 w-2/3 rounded-pill bg-pale-sand" />
          <div className="h-5 w-1/2 rounded-pill bg-pale-sand" />
        </div>
        <div className="h-24 rounded-card bg-pale-sand" />
        <div className="h-40 rounded-card bg-pale-sand" />
      </div>
    </div>
  );
}
