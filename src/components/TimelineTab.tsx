import React, { useState } from 'react';
import { Project, LaborSettings } from '../types';
import { Clock, Users, Calendar, CheckSquare, Wrench, ShieldCheck, Truck, Layers } from 'lucide-react';

interface TimelineTabProps {
  projects: Project[];
  laborSettings: LaborSettings;
  setLaborSettings: (settings: LaborSettings) => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  projects,
  laborSettings,
  setLaborSettings,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [workersCount, setWorkersCount] = useState<number>(laborSettings.workersCount || 2);
  const [dailyCapacityPerWorker, setDailyCapacityPerWorker] = useState<number>(8); // 8 m1 per worker per day

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Calculated totals
  const totalLinearMeters = activeProject
    ? activeProject.items.reduce((sum, item) => sum + item.perimeterMeters, 0)
    : 100;

  // Capacity calculation
  const totalDailyCapacity = Math.max(1, workersCount * dailyCapacityPerWorker);
  const estimatedDays = Math.ceil(totalLinearMeters / totalDailyCapacity) + 2; // +2 days buffer

  // Milestone durations breakdown
  const milestones = [
    {
      step: 1,
      title: 'Survey & Pengukuran Presisi',
      duration: '1 Hari',
      desc: 'Pengukuran ulang opening siku di lokasi, verifikasi level, dan gambar kerja.',
      icon: CheckSquare,
      color: 'bg-amber-500',
    },
    {
      step: 2,
      title: 'Pemesanan Material & Aksesori',
      duration: '1-2 Hari',
      desc: 'Pengadaan batang alumunium 6m, pemesanan kaca sesuai ukuran, dan hardware.',
      icon: Truck,
      color: 'bg-indigo-500',
    },
    {
      step: 3,
      title: 'Pemotongan & Fabrikasi Kusen',
      duration: `${Math.ceil(estimatedDays * 0.3)} Hari`,
      desc: 'Pemotongan sudut 45°/90°, pembentukan sponeng, punching lubang drainage.',
      icon: Wrench,
      color: 'bg-sky-500',
    },
    {
      step: 4,
      title: 'Perakitan Frame & Fitting Hardware',
      duration: `${Math.ceil(estimatedDays * 0.3)} Hari`,
      desc: 'Perakitan siku sudut, pemasangan engsel, lockset, dan karet seal.',
      icon: Layers,
      color: 'bg-teal-500',
    },
    {
      step: 5,
      title: 'Pemasangan di Lokasi & Sealant',
      duration: `${Math.ceil(estimatedDays * 0.3)} Hari`,
      desc: 'Instalasi fischer dinding, penyetelan presisi, pasang kaca & silicone sealant.',
      icon: ShieldCheck,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Estimasi Waktu Pengerjaan Proyek (Project Timeline)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Simulasi durasi pengerjaan fabrikasi & instalasi berdasarkan volume meter lari dan kapasitas tim tukang.
            </p>
          </div>

          {/* Project Selector */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Pilih Proyek:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.clientName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Capacity Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="block text-xs text-slate-400 font-bold mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> Jumlah Tukang (Orang)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={workersCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWorkersCount(val);
                setLaborSettings({ ...laborSettings, workersCount: val });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
            />
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="block text-xs text-slate-400 font-bold mb-1 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-sky-400" /> Kapasitas (Meter / Hari / Tukang)
            </label>
            <input
              type="number"
              min="2"
              max="30"
              value={dailyCapacityPerWorker}
              onChange={(e) => setDailyCapacityPerWorker(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-100"
            />
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase">Estimasi Durasi Total</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">{estimatedDays} <span className="text-xs text-slate-400 font-normal">Hari Kerja</span></p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Milestone Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" /> Tahapan & Milestones Pengerjaan
        </h3>

        <div className="relative space-y-6 before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.step} className="relative flex items-start gap-4 group">
                <div className={`relative z-10 w-12 h-12 rounded-2xl ${m.color} text-slate-950 font-black flex items-center justify-center text-base shadow-lg transition-transform group-hover:scale-105`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-200">
                      Tahap {m.step}: {m.title}
                    </h4>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {m.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
