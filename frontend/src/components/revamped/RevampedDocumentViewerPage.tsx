import React, { useState } from 'react';
import {
  Search,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

interface RevampedDocumentViewerPageProps {
  onNavigate: (view: 'home' | 'graph' | 'documents' | 'simulation' | 'verify') => void;
}

export const RevampedDocumentViewerPage: React.FC<RevampedDocumentViewerPageProps> = ({ onNavigate }) => {
  const [selectedDocId, setSelectedDocId] = useState('doc_petition');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'insights' | 'citations' | 'chat'>('insights');
  const [currentPage, setCurrentPage] = useState(14);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Analyzing Page 14 of Petition under Article 226. Ground 12 establishes violation of Article 14 with citations to Maneka Gandhi and E.P. Royappa. Ask me any question regarding this pleading.'
    }
  ]);

  const documentList = [
    { id: 'doc_petition', title: 'Petition under Article 226', meta: 'Filed 2023 · 45 pages', date: '2023', active: true },
    { id: 'doc_fir', title: 'FIR No. 45/2023', meta: '12 Jan 2023 · 12 pages', date: '12 Jan 2023' },
    { id: 'doc_chargesheet', title: 'Charge Sheet', meta: '14 Feb 2023 · 28 pages', date: '14 Feb 2023' },
    { id: 'doc_affidavit_pet', title: 'Affidavit (Petitioner)', meta: '20 Feb 2023 · 8 pages', date: '20 Feb 2023' },
    { id: 'doc_cctv', title: 'CCTV Report', meta: '18 Jan 2023 · 10 pages', date: '18 Jan 2023' },
    { id: 'doc_order_hc', title: 'Order (High Court)', meta: '01 Mar 2023 · 6 pages', date: '01 Mar 2023' },
    { id: 'doc_counter', title: 'Counter Affidavit', meta: '28 Feb 2023 · 14 pages', date: '28 Feb 2023' }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const query = chatMessage;
    setChatLog((prev) => [...prev, { sender: 'user', text: query }]);
    setChatMessage('');

    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Verified on Page 14, Para 12: The petitioner argues arbitrary deprivation of natural justice without an opportunity of being heard, citing E.P. Royappa v. State of Tamil Nadu (1974) 4 SCC 3.`
        }
      ]);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0c0d12] text-white overflow-hidden">
      {/* 1) TOP BREADCRUMB & DOCUMENT SEARCH BAR matching bottom-left design */}
      <div className="px-6 py-3 border-b border-[#1f2433] bg-[#111319] flex flex-wrap items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span
            onClick={() => onNavigate('graph')}
            className="hover:text-white cursor-pointer transition-colors"
          >
            Sharma vs State of Maharashtra
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">Documents</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-serif">Petition under Article 226</span>
        </div>

        {/* In-Document Search Input */}
        <div className="relative w-64 lg:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search in document..."
            className="w-full bg-[#181b24] border border-[#2a2f40] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e53935] transition-colors font-sans"
          />
        </div>
      </div>

      {/* 2) 3-COLUMN WORKSPACE: LEFT DOCUMENT INDEX | CENTER COURT VIEWER | RIGHT INSIGHTS */}
      <div className="doc-viewer-grid">
        {/* Column 1: Document Index Sidebar (12 Documents) */}
        <div className="doc-viewer-sidebar">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Documents (12)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">EN · HI</span>
            </div>

            <div className="space-y-1.5">
              {documentList.map((doc) => {
                const isActive = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-[#2b1717] border-[#e53935]/40 text-white'
                        : 'bg-[#141620] hover:bg-[#1a1e2b] border-[#1e2230] text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <FileText
                        size={16}
                        className={`shrink-0 mt-0.5 ${isActive ? 'text-[#ef4444]' : 'text-slate-400'}`}
                      />
                      <div>
                        <div className={`text-xs font-medium leading-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">{doc.meta}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1c202d] text-center">
            <span className="text-[11px] text-slate-400 font-mono">
              Provenance Verified • OCR Density: 98.4%
            </span>
          </div>
        </div>

        {/* Column 2: Center Court Filing Document Paper Reader */}
        <div className="doc-viewer-center">
          {/* Document Controls Top Bar */}
          <div className="w-full max-w-2xl mb-4 flex items-center justify-between text-xs text-slate-300 px-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-[#1e2230] hover:bg-[#282d3e]"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono text-slate-200">
                Page <span className="text-white font-semibold">{currentPage}</span> of 45
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(45, p + 1))}
                className="p-1 rounded bg-[#1e2230] hover:bg-[#282d3e]"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-slate-400">{zoomLevel}%</span>
              <button
                onClick={() => alert('Downloading verified court bundle PDF...')}
                className="p-1.5 rounded bg-[#1e2230] hover:bg-[#282d3e] text-slate-300"
                title="Download Document"
              >
                <Download size={13} />
              </button>
              <button
                className="p-1.5 rounded bg-[#1e2230] hover:bg-[#282d3e] text-slate-300"
                title="Fullscreen"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* Realistic High-Resolution Court Document Sheet */}
          <div className="doc-paper-sheet">
            {/* Page Number Watermark */}
            <div className="text-center font-mono text-xs text-slate-500 mb-8 pb-2 border-b border-[#e2d9cc]">
              14
            </div>

            {/* Paragraph 12 (Highlighted in Soft Rose with Citation Pin matching design) */}
            <div className="mb-6 p-4 rounded-lg bg-[#fee2e2]/70 border-l-4 border-[#e53935] text-[#18181b] leading-relaxed relative group">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[14.5px] font-normal leading-[1.7]">
                  <strong className="font-semibold font-mono text-[13px] mr-2">12.</strong>
                  The impugned order is arbitrary, violative of Article 14 and contrary to the settled position of law. The same has been passed without application of mind and is liable to be set aside.
                </p>
                <span className="shrink-0 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#c52828] text-white font-semibold">
                  Cited
                </span>
              </div>
            </div>

            {/* Paragraph 13 */}
            <div className="mb-6 p-2 text-[#2d3139] leading-relaxed">
              <p className="text-[14.5px] font-normal leading-[1.7]">
                <strong className="font-semibold font-mono text-[13px] mr-2">13.</strong>
                The petitioner has a legitimate expectation based on the consistent past practice of the authorities. The present action is discriminatory and without any rational basis.
              </p>
            </div>

            {/* Paragraph 14 */}
            <div className="mb-6 p-2 text-[#2d3139] leading-relaxed">
              <p className="text-[14.5px] font-normal leading-[1.7]">
                <strong className="font-semibold font-mono text-[13px] mr-2">14.</strong>
                It is further submitted that the procedure adopted is in violation of principles of natural justice, inasmuch as no reasonable opportunity of hearing was granted to the petitioner.
              </p>
            </div>

            {/* Bottom Court Stamped Seal */}
            <div className="mt-16 pt-4 border-t border-[#e2d9cc] flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>HIGH COURT OF JUDICATURE AT BOMBAY</span>
              <span className="text-[#991b1b] font-semibold">TRUE CERTIFIED COPY</span>
            </div>
          </div>
        </div>

        {/* Column 3: Right Inspector Drawer matching bottom-left design */}
        <div className="doc-viewer-inspector">
          <div>
            {/* Tabs: Insights | Citations | Chat */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#171a25] border border-[#23293a] mb-5">
              {[
                { id: 'insights', label: 'Insights' },
                { id: 'citations', label: 'Citations' },
                { id: 'chat', label: 'Chat' }
              ].map((tab) => {
                const isActive = activeInspectorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInspectorTab(tab.id as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-[#222736] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: INSIGHTS matching design */}
            {activeInspectorTab === 'insights' && (
              <div className="space-y-5">
                {/* Key Points (Page 14) */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Key Points (Page 14)
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-1.5 shrink-0" />
                      <span>Challenges the impugned order on grounds of Article 14.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-1.5 shrink-0" />
                      <span>Argues lack of application of mind by the executive.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-1.5 shrink-0" />
                      <span>States violation of principles of natural justice.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-1.5 shrink-0" />
                      <span>Seeks to set aside the order under writ jurisdiction.</span>
                    </li>
                  </ul>
                </div>

                {/* Citations Found */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Citations Found
                  </h4>

                  <div className="space-y-2.5">
                    {/* Citation 1 */}
                    <div className="p-3 rounded-xl bg-[#171a25] border border-[#23293a]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">Maneka Gandhi v. UOI</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-sans font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">(1978) 1 SCC 248</div>
                    </div>

                    {/* Citation 2 */}
                    <div className="p-3 rounded-xl bg-[#171a25] border border-[#23293a]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">E.P. Royappa v. State of Tamil Nadu</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-sans font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">(1974) 4 SCC 3</div>
                    </div>
                  </div>
                </div>

                {/* Related Facts */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                    Related Facts
                  </h4>
                  <div className="p-3 rounded-xl bg-[#171a25] border border-[#23293a] text-xs text-slate-300 leading-relaxed mb-3">
                    Supports the claim of arbitrary action by the authorities in Paragraph 12.
                  </div>
                  <button
                    onClick={() => onNavigate('graph')}
                    className="w-full py-2 px-3 rounded-lg bg-[#202534] hover:bg-[#282f42] text-xs font-medium text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View in Case Graph</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: CITATIONS (6-Check Protocol) */}
            {activeInspectorTab === 'citations' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#171a25] border border-[#23293a]">
                  <div className="text-xs font-semibold text-white mb-2">
                    6-Check Citation Verification Audit
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { name: '1. Existence', desc: 'Valid citation in SC whitelisted database', pass: true },
                      { name: '2. Identity', desc: 'Matching bench, date and reporter', pass: true },
                      { name: '3. Source', desc: 'Primary SCC text retrieved', pass: true },
                      { name: '4. Quotation', desc: 'Verbatim text matches official judgment', pass: true },
                      { name: '5. Proposition', desc: 'Directly supports non-arbitrariness doctrine', pass: true },
                      { name: '6. Trace', desc: 'Page-level coordinate bound to Para 12', pass: true }
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-300 py-1 border-b border-[#202534] last:border-none">
                        <span>{c.name}</span>
                        <span className="text-emerald-400 font-mono font-medium">PASS</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: CHAT (In-line RAG Document Assistant) */}
            {activeInspectorTab === 'chat' && (
              <div className="flex flex-col h-[380px]">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
                  {chatLog.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#c52828] text-white ml-6'
                          : 'bg-[#171a25] text-slate-200 border border-[#23293a] mr-4'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask about this page..."
                    className="flex-1 bg-[#181b24] border border-[#2a2f40] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e53935]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-[#c52828] text-white text-xs font-semibold"
                  >
                    Ask
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Bottom Button */}
          <div className="pt-4 border-t border-[#1f2433]">
            <button
              onClick={() => onNavigate('simulation')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#c52828] hover:bg-[#e53935] text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-[#c52828]/20 flex items-center justify-center gap-2"
            >
              <span>Simulate Courtroom Argument</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
