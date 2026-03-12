import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useModel } from './ModelContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2, CalendarDays } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 flex-shrink-0 mt-0.5">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200'}`}>
        {isUser ? (
          <p className="leading-relaxed">{content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-slate max-w-none text-slate-800 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
              table: ({ children }) => <table className="text-xs border-collapse my-2 w-full">{children}</table>,
              th: ({ children }) => <th className="border border-slate-200 px-2 py-1 bg-slate-50 font-medium text-left">{children}</th>,
              td: ({ children }) => <td className="border border-slate-200 px-2 py-1">{children}</td>,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 flex-shrink-0 mt-0.5">
          <User className="h-4 w-4 text-slate-600" />
        </div>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  'What happens if the Staff Accountant starts in Month 4 instead of Month 1?',
  'If Comstar raises their fee to 6%, how does that change the break-even for the Billing Specialist?',
  'Walk me through the Year 1 zero-levy options and which is most defensible to the Select Board',
  'What is the sequencing risk if ERP delays to FY2029?',
  'How does the Transfer Station rebuild strategy affect the 5-year model?',
  'What does the audit finding 2021-001 mean for our timeline?',
];

export default function TimelineAI() {
  const { settings, milestoneDates } = useModel();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `I'm your Machias strategic planning assistant. I have full context on your restructuring plan, financial model, ERP evaluation, and all timeline dependencies.\n\nAsk me anything about sequencing, financial trade-offs, risk analysis, or how to present specific decisions to the Select Board. You can also ask me to adjust milestone timelines — for example: *"What if the SA hire slips to Month 4?"*\n\nProject start date: **${settings.start_date}**. What would you like to explore?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    const systemContext = `You are a municipal finance and strategic planning expert advising the Town of Machias, Maine. You have full access to their administrative restructuring plan and financial model data.

KEY FACTS (all confirmed from documents):
- Project start date: ${settings.start_date}
- Staff Accountant: $${settings.sa_base_salary} base, $108,061 fully loaded (Family health tier), hire Month 1-3
- Billing Specialist: $${settings.bs_base_salary} base, $96,196 fully loaded, hire Month 7
- GA Coordinator: $${settings.ga_stipend}/yr stipend, hire Month 9
- FD fully loaded: $${settings.fd_loaded_cost} | TM fully loaded: $${settings.tm_loaded_cost}
- Comstar fee: ${settings.comstar_fee_rate * 100}% confirmed | FY2024-25 collections: $1,095,931 | Fee: $57,197
- EMS transports FY2024-25: ${settings.ems_transports} | Avg revenue/transport: $${settings.avg_revenue_per_transport}
- In-house collection target: ${settings.inhouse_steady_rate * 100}% (from 87.4% baseline)
- Enterprise overhead (existing): Ambulance $${settings.ambulance_transfer} | Sewer $${settings.sewer_transfer} | TS $${settings.ts_transfer} | TBC $${settings.telebusiness_transfer} | 7CS $${settings.court_st_transfer}
- Stipend elimination: $${settings.stipend_elimination}/yr
- Airport savings: $${settings.airport_savings}/yr
- Control risk exposure: $${settings.control_risk_exposure}/yr
- Regional services: RB $${settings.rb_annual_contract} | Machiasport $${settings.machiasport_annual_contract} | Marshfield $${settings.marshfield_annual_contract} | Whitneyville $${settings.whitneyville_annual_contract} | Northfield $${settings.northfield_annual_contract}
- ERP: $${settings.erp_y1_cost} Y1 | $${settings.erp_designated_fund_offset} designated fund offset | $${settings.erp_ongoing_cost}/yr ongoing | $${settings.erp_annual_value}/yr value
- GF undesignated balance: $${settings.gf_undesignated_balance}
- Ambulance fund balance: $${settings.ambulance_fund_balance} ($${settings.ambulance_fund_balance - settings.ambulance_loan_payoff} net after $${settings.ambulance_loan_payoff} loan payoff)
- Total assessed value: $${settings.total_assessed_value} | Mill rate: ${settings.current_mill_rate}
- Year 1 levy gap: ~$89,867 (covered by Option A: Ambulance fund balance draw)
- Audit Finding 2021-001: Material weakness in year-end closing, segregation of duties
- Break-even: ~Month 7-8

MILESTONE DATES (from start ${settings.start_date}):
- SA hire target: ${milestoneDates.saHire}
- BS hire target: ${milestoneDates.bsHire}
- Comstar parallel run: ${milestoneDates.comstarParallel}
- Comstar cutover: ${milestoneDates.comstarCutover}
- GA Coordinator hire: ${milestoneDates.gaHire}
- RB/Machiasport interlocals: ${milestoneDates.interlocalsExec}
- ERP RFP: ${milestoneDates.erpRfp}
- ERP go-live: ${milestoneDates.erpGoLive}

ERP SYSTEMS UNDER EVALUATION: Sage Intacct, TownCloud, Harris TRIO, Tyler Technologies (Munis/ERP Pro), Edmunds GovTech, OpenGov, CivicPlus, Infor, Microsoft Dynamics 365, Black Mountain Software, Caselle, BS&A Software, ClearGov, Paylocity, BambooHR, ADP, Paycor, Paycom, NEOGOV, HiBob, iSolved, Harris TRIO with TimeClock Plus, Harris TRIO with Smart AP, Harris TRIO with Employee Self Service, SmartFusion.

Be concise, precise, and reference specific dollar figures. When analyzing trade-offs, quantify the financial impact where possible. Format tables using markdown when helpful.`;

    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemContext}\n\nConversation history:\n${history}\n\nUser: ${msg}\n\nAssistant:`,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/60 bg-slate-50 overflow-hidden" style={{ height: '600px' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
        <Bot className="h-4 w-4 text-slate-700" />
        <span className="text-sm font-semibold text-slate-800">Strategic Planning Assistant</span>
        <CalendarDays className="h-3.5 w-3.5 text-slate-400 ml-2" />
        <span className="text-xs text-slate-400">Start: {settings.start_date}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
        {loading && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800"><Bot className="h-4 w-4 text-white" /></div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.slice(0, 3).map((s, i) => (
            <button key={i} onClick={() => send(s)} className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full px-2.5 py-1 transition-colors truncate max-w-[200px]">
              {s.slice(0, 50)}…
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about timeline, financial trade-offs, Select Board presentation..."
            className="text-sm h-9"
            disabled={loading}
          />
          <Button size="sm" onClick={() => send()} disabled={loading || !input.trim()} className="h-9 px-3">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}