export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Organizational Knowledge Gap Intelligence Platform. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
            v1.0.0 &middot; Platform Active
          </span>
        </div>
      </div>
    </footer>
  );
}
