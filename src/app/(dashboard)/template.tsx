// Re-mounts on every route change, giving each page a soft fade-up entrance.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
