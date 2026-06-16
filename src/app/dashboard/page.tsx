import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QuickActionLink from "@/components/QuickActionLink";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [docCount, keyCount, activityCount, recentActivities] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.rsaKeyPair.count({ where: { userId, isActive: true } }),
    prisma.activityLog.count({ where: { userId } }),
    prisma.activityLog.findMany({
      where: { userId },
      include: { document: { select: { originalName: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const stats = [
    {
      label: "Total Dokumen",
      value: docCount,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      iconBg: "rgba(37,99,235,0.12)",
      iconColor: "#60a5fa",
      href: "/dashboard/documents",
    },
    {
      label: "Key Pair Aktif",
      value: keyCount,
      icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
      iconBg: "rgba(22,163,74,0.12)",
      iconColor: "#4ade80",
      href: "/dashboard/keys",
    },
    {
      label: "Total Aktivitas",
      value: activityCount,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      iconBg: "rgba(202,138,4,0.12)",
      iconColor: "#fbbf24",
      href: "/dashboard/activity",
    },
  ];

  const activityColors: Record<string, string> = {
    ENCRYPT: "badge-blue",
    DECRYPT: "badge-green",
    UPLOAD: "badge-yellow",
    DOWNLOAD: "badge-gray",
    KEY_GENERATE: "badge-green",
    KEY_DELETE: "badge-red",
    LOGIN: "badge-gray",
    REGISTER: "badge-blue",
    LOGOUT: "badge-gray",
  };
  const activityLabels: Record<string, string> = {
    ENCRYPT: "Enkripsi",
    DECRYPT: "Dekripsi",
    UPLOAD: "Upload",
    DOWNLOAD: "Download",
    KEY_GENERATE: "Buat Kunci",
    KEY_DELETE: "Hapus Kunci",
    LOGIN: "Login",
    REGISTER: "Register",
    LOGOUT: "Logout",
  };

  const quickActions = [
    {
      href: "/dashboard/encrypt",
      label: "Enkripsi Dokumen Baru",
      desc: "Upload PDF/Word dan enkripsi dengan AES-256",
      iconBg: "rgba(37,99,235,0.12)",
      iconColor: "#60a5fa",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
    {
      href: "/dashboard/decrypt",
      label: "Dekripsi Dokumen",
      desc: "Buka dokumen terenkripsi dengan private key",
      iconBg: "rgba(22,163,74,0.12)",
      iconColor: "#4ade80",
      icon: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    },
    {
      href: "/dashboard/keys",
      label: "Buat RSA Key Pair Baru",
      desc: "Generate RSA-2048 public/private key pair",
      iconBg: "rgba(202,138,4,0.12)",
      iconColor: "#fbbf24",
      icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Selamat datang, {session?.user?.name?.split(" ")[0] ?? "User"} 👋
        </h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Kelola enkripsi dokumen Anda dengan AES-256 + RSA-2048
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-4 sm:p-5 transition-all duration-200 hover:shadow-lg group">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}
              >
                <svg className="w-5 sm:w-6 h-5 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: "var(--text-primary)" }}>
            Aksi Cepat
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {quickActions.map((action) => (
              <QuickActionLink key={action.href} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="font-semibold text-base sm:text-lg" style={{ color: "var(--text-primary)" }}>
              Aktivitas Terbaru
            </h2>
            <Link href="/dashboard/activity" className="text-primary-500 hover:text-primary-400 text-xs font-medium whitespace-nowrap">
              Lihat semua →
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center py-6 sm:py-8" style={{ color: "var(--text-muted)" }}>
              <svg className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-xs sm:text-sm">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                  <span className={`${activityColors[activity.action] ?? "badge-gray"} mt-0.5 flex-shrink-0 text-xs`}>
                    {activityLabels[activity.action] ?? activity.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {activity.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {new Date(activity.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="mt-6 card p-4 sm:p-6">
        <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: "var(--text-primary)" }}>
          Informasi Algoritma
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {[
            {
              badge: "badge-blue",
              badgeLabel: "Simetris",
              title: "AES-256-CBC",
              titleColor: "#60a5fa",
              rows: [
                ["Key Size", "256 bit (32 byte)"],
                ["Block Size", "128 bit (16 byte)"],
                ["IV", "128 bit acak per file"],
                ["Mode", "Cipher Block Chaining"],
              ],
            },
            {
              badge: "badge-green",
              badgeLabel: "Asimetris",
              title: "RSA-2048-OAEP",
              titleColor: "#4ade80",
              rows: [
                ["Key Size", "2048 bit"],
                ["Padding", "OAEP (SHA-256)"],
                ["Fungsi", "Enkripsi kunci AES"],
                ["Keamanan", "≥112 bit security"],
              ],
            },
          ].map((algo) => (
            <div
              key={algo.title}
              className="rounded-xl p-3 sm:p-4"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={algo.badge}>{algo.badgeLabel}</span>
                <span className="font-mono text-xs sm:text-sm font-semibold" style={{ color: algo.titleColor }}>
                  {algo.title}
                </span>
              </div>
              <div className="space-y-1 sm:space-y-1.5 text-xs font-mono">
                {algo.rows.map(([k, v]) => (
                  <p key={k} style={{ color: "var(--text-secondary)" }}>
                    {k}: <span style={{ color: "var(--text-primary)" }}>{v}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
