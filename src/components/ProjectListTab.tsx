import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { formatRupiah } from '../utils/calculator';
import { generateProjectPdf } from '../utils/pdfGenerator';
import {
  FolderKanban,
  Search,
  FileText,
  Download,
  Calendar,
  User,
  Phone,
  Clock,
  CheckCircle2,
  Trash2,
  Eye,
  Copy,
  Layers,
  Edit3,
} from 'lucide-react';

interface ProjectListTabProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
  onUpdateStatus: (projectId: string, newStatus: ProjectStatus) => void;
}

export const ProjectListTab: React.FC<ProjectListTabProps> = ({
  projects,
  onSelectProject,
  onDeleteProject,
  onDuplicateProject,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusBadges: Record<ProjectStatus, { label: string; color: string }> = {
    draft: { label: 'Draft RAB', color: 'bg-slate-800 text-slate-300 border-slate-700' },
    quoted: { label: 'Penawaran', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    approved: { label: 'Disetujui', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    in_progress: { label: 'Pengerjaan', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
    completed: { label: 'Selesai', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-amber-400" />
              Manajemen Data Proyek RAB Kusen
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Kelola penawaran proyek, update status pengerjaan, dan cetak PDF rincian anggaran biaya.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-300 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            Total Proyek: <strong className="text-amber-400 font-mono text-sm">{projects.length}</strong>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama proyek, nama klien, atau nomor RAB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {['all', 'draft', 'quoted', 'approved', 'in_progress', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                  selectedStatus === st
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {st === 'all' ? 'Semua' : statusBadges[st as ProjectStatus]?.label || st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-700" />
          <p className="text-sm font-semibold">Tidak ada proyek yang sesuai dengan pencarian / filter.</p>
          <p className="text-xs text-slate-600">Buat RAB baru melalui Kalkulator untuk menambahkan proyek baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const badge = statusBadges[project.status] || statusBadges.draft;
            const totalItemsCount = project.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={project.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{project.estimateNumber}</span>
                      <h3 className="text-base font-bold text-slate-100 line-clamp-1">{project.title}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <p className="flex items-center gap-1.5 text-slate-200 font-semibold">
                      <User className="w-3.5 h-3.5 text-amber-400" /> {project.clientName}
                    </p>
                    {project.clientPhone && (
                      <p className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {project.clientPhone}
                      </p>
                    )}
                  </div>

                  {/* Volume & Production Duration Info */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" /> {totalItemsCount} Unit Kusen
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Est {project.estimatedProductionDays} Hari Kerja
                    </span>
                  </div>

                  {/* Grand Total Price */}
                  <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Grand Total RAB:</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {formatRupiah(project.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
                  {/* Status Change Selector */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Status:</span>
                    <select
                      value={project.status}
                      onChange={(e) => onUpdateStatus(project.id, e.target.value as ProjectStatus)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="draft">Draft RAB</option>
                      <option value="quoted">Penawaran Diterkirim</option>
                      <option value="approved">Disetujui (SPK)</option>
                      <option value="in_progress">Dalam Pengerjaan</option>
                      <option value="completed">Selesai</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectProject(project)}
                      className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold transition shadow-md shadow-amber-500/20"
                      title="Edit Pesanan & RAB Proyek Ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      onClick={() => onSelectProject(project)}
                      className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                      title="Lihat Detail RAB"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>

                    <button
                      onClick={() => generateProjectPdf(project)}
                      className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition"
                      title="Download PDF RAB"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>

                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-semibold transition"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
