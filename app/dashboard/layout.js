import Script from "next/script";

export const metadata = {
  title: "Dashboard - Purple Housing",
  icons: { icon: "/images/favicon.png" },
};

export default function DashboardLayout({ children }) {
  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>{`
        body { margin: 0; font-family: Arial; background: #f4f4f4; }
        .dashboard-container { display: flex; }
        .sidebar { width: 250px; background: #43086b; color: white; padding: 20px; display: flex; flex-direction: column; height: 100vh; position: fixed; top: 0; left: 0; z-index: 200; overflow-y: auto; }
        .sidebar-bottom { margin-top: auto; padding-top: 15px; }
        .sidebar h2 { color: #fff; margin-bottom: 20px; }
        .sidebar a { display: block; color: #fff; margin: 10px 0; text-decoration: none; padding: 10px; border-radius: 5px; font-size: 15px; font-weight: 500; font-family: 'Roboto'; }
        .sidebar a:hover { background: rgba(255,255,255,0.1); }
        .dashboard-main { flex: 1; margin-left: 250px; display: flex; flex-direction: column; min-height: 100vh; }
        .dashboard-topbar { position: sticky; top: 0; z-index: 100; background: #fff; border-bottom: 1px solid #ece6f3; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; box-shadow: 0 2px 8px rgba(67,8,107,0.07); }
        .dashboard-topbar__brand { font-size: 15px; font-weight: 600; color: #43086b; letter-spacing: 0.01em; }
        .dashboard-topbar__brand span { color: #888; font-weight: 400; margin-left: 6px; font-size: 13px; }
        .dashboard-topbar__right { display: flex; align-items: center; gap: 16px; }
        .dashboard-topbar__avatar { width: 34px; height: 34px; border-radius: 50%; background: #43086b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
        .dashboard-topbar__logout { font-size: 13px; color: #43086b; text-decoration: none; font-weight: 600; border: 1px solid #43086b; padding: 5px 14px; border-radius: 6px; transition: background 0.2s, color 0.2s; }
        .dashboard-topbar__logout:hover { background: #43086b; color: #fff; }
        .content { flex: 1; padding: 28px 30px; background: #f4f4f4; }
      `}</style>
      <div className="dashboard-container">
        <DashboardSidebar />
        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar__brand">
              Purple Housing <span>Admin Dashboard</span>
            </div>
            <div className="dashboard-topbar__right">
              <div className="dashboard-topbar__avatar">A</div>
              <a href="/api/auth/logout" className="dashboard-topbar__logout">
                Logout
              </a>
            </div>
          </header>
          <div className="content">{children}</div>
        </div>
      </div>
      <Script
        src="https://cdn.ckeditor.com/4.21.0/standard/ckeditor.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
      />
    </>
  );
}

function DashboardSidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-top">
        <img src="/images/Logo-1.png" alt="logo" className="img-fluid mb-3" />
        <a href="/dashboard">Properties</a>
        <a href="/dashboard/listing">Create a List</a>
        <a href="/dashboard/applications">Applying List</a>
        <a href="/dashboard/schedule">Schedule a Showing</a>
        <a href="/dashboard/blogs">Blogs</a>
      </div>
    </div>
  );
}
