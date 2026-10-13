import React, { useState } from 'react';
import { Share2, Download, MoreHorizontal, FileText, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { ThreeCaseGraphView, GraphNode } from '../three/ThreeCaseGraphView';

interface RevampedCaseGraphPageProps {
  onNavigate: (view: 'home' | 'graph' | 'documents' | 'simulation' | 'verify') => void;
  onOpenDocument?: (docName: string, page: number) => void;
}

export const RevampedCaseGraphPage: React.FC<RevampedCaseGraphPageProps> = ({
  onNavigate,
  onOpenDocument
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode>({
    id: 'node-incident',
    name: 'Incident',
    subtitle: '12 Jan 2023',
    category: 'event',
    color: '#e53935',
    pos3D: [0, 0, 0],
    pos2D: [0, 0, 0],
    description: 'Alleged unlawful detention of the petitioner without producing before magistrate within 24 hours of custody.',
    sources: [
      { title: 'FIR (Page 2)', file: 'doc_fir_2023.pdf', page: 2 },
      { title: 'Petition (Page 14)', file: 'petition.pdf', page: 14 },
      { title: 'CCTV Report (Page 5)', file: 'cctv_report.pdf', page: 5 }
    ],
    date: '12 Jan 2023'
  });

  const [activeSubTab, setActiveSubTab] = useState<'case_graph' | 'timeline' | 'evidence' | 'issues'>('case_graph');

  return (
    <div className="flex-1 flex flex-col bg-[#0c0d12] text-white overflow-hidden">
      {/* 1) TOP CASE SWITCHER & ACTIONS BAR matching top-right design */}
      <div className="px-6 py-3.5 border-b border-[#1f2433] bg-[#111319] flex items-center justify-between">
        {/* Case Title with Active Status */}
        <div className="flex items-center gap-3">
          <h2 className="text-base lg:text-lg font-serif font-medium text-white flex items-center gap-2.5">
            <span>Sharma vs State of Maharashtra</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </h2>
        </div>

        {/* Action Buttons: Share, Export, More */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Case Graph URL copied to clipboard.')}
            className="px-3 py-1.5 rounded-lg bg-[#181b24] hover:bg-[#202532] border border-[#292f42] text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
          <button
            onClick={() => alert('Exporting Master Case Graph JSON...')}
            className="px-3 py-1.5 rounded-lg bg-[#181b24] hover:bg-[#202532] border border-[#292f42] text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <button className="w-8 h-8 rounded-lg bg-[#181b24] hover:bg-[#202532] border border-[#292f42] text-slate-300 flex items-center justify-center text-xs">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* 2) SUB-NAVIGATION TABS BAR matching design */}
      <div className="px-6 border-b border-[#1f2433] bg-[#0f1117] flex items-center gap-6 overflow-x-auto text-[13px] font-medium">
        {[
          { id: 'overview', label: 'Overview', nav: null },
          { id: 'documents', label: 'Documents', nav: 'documents' },
          { id: 'case_graph', label: 'Case Graph', nav: 'graph' },
          { id: 'timeline', label: 'Timeline', nav: null },
          { id: 'evidence', label: 'Evidence', nav: null },
          { id: 'legal_issues', label: 'Legal Issues', nav: null },
          { id: 'research', label: 'Research', nav: 'verify' },
          { id: 'simulation', label: 'Simulation', nav: 'simulation' }
        ].map((tab) => {
          const isActive = tab.id === 'case_graph';
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.nav) onNavigate(tab.nav as any);
              }}
              className={`py-3 transition-colors relative whitespace-nowrap ${
                isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e53935] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3) MAIN WORKSPACE: 3D GRAPH CANVAS (LEFT) + RIGHT INSPECTOR DRAWER (RIGHT) */}
      <div className="case-graph-body-grid">
        {/* Left Stage: Three.js Case Graph */}
        <div className="case-graph-canvas-col">
          <ThreeCaseGraphView
            selectedNodeId={selectedNode.id}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Right Stage: Inspector Drawer matching design */}
        <div className="case-graph-inspector">
          <div>
            {/* Header / Node Title */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#202534]">
              <div>
                <h3 className="text-lg font-serif font-medium text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                  <span>{selectedNode.name}</span>
                </h3>
                {selectedNode.subtitle && (
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{selectedNode.subtitle}</div>
                )}
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1c202d] text-slate-300 uppercase border border-[#2a3044]">
                {selectedNode.category.replace('_', ' ')}
              </span>
            </div>

            {/* Metadata Fields */}
            <div className="space-y-3 mb-5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Type</span>
                <span className="text-white font-medium capitalize">{selectedNode.category}</span>
              </div>
              {selectedNode.date && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Date</span>
                  <span className="text-white font-mono flex items-center gap-1">
                    <Calendar size={12} className="text-[#ef4444]" />
                    {selectedNode.date}
                  </span>
                </div>
              )}
              <div className="pt-2 text-slate-300 leading-relaxed text-[13px] bg-[#171a25] p-3 rounded-xl border border-[#23293a]">
                {selectedNode.description}
              </div>
            </div>

            {/* Verified Sources List matching design */}
            <div className="mb-6">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>Sources ({selectedNode.sources.length})</span>
                <span className="text-[10px] text-emerald-400 font-sans font-medium flex items-center gap-1">
                  ✓ Verified Record
                </span>
              </div>

              <div className="space-y-2">
                {selectedNode.sources.map((src, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (onOpenDocument) onOpenDocument(src.file, src.page);
                      else onNavigate('documents');
                    }}
                    className="p-3 rounded-xl bg-[#171a25] hover:bg-[#1f2434] border border-[#23293a] hover:border-[#38415c] transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#202534] flex items-center justify-center text-slate-300 group-hover:text-white">
                        <FileText size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white group-hover:text-[#ef4444] transition-colors">
                          {src.title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{src.file}</div>
                      </div>
                    </div>

                    <ExternalLink size={13} className="text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action: View in Timeline or View in Documents */}
          <div className="pt-4 border-t border-[#202534] space-y-2">
            <button
              onClick={() => onNavigate('documents')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#c52828] hover:bg-[#e53935] text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#c52828]/20 flex items-center justify-center gap-2"
            >
              <span>Inspect in Document Viewer</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => onNavigate('simulation')}
              className="w-full py-2 px-4 rounded-xl bg-[#171a25] hover:bg-[#1f2434] border border-[#23293a] text-slate-300 text-xs font-medium transition-all"
            >
              <span>Argue this Node in Courtroom Arena</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
