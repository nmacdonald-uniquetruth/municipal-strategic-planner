import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import {
  WORKFLOW_STAGE_LABELS,
  WORKFLOW_STAGE_DESCRIPTIONS,
  getProposalChecklist,
  getWorkflowCompletionPercentage,
} from './workflowValidator';

export default function ProposalWorkflowStatus({ proposal, evaluation }) {
  const checklist = getProposalChecklist(proposal, evaluation);
  const completionPercentage = getWorkflowCompletionPercentage(proposal, evaluation);

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      under_review: 'bg-blue-100 text-blue-800',
      evaluated: 'bg-purple-100 text-purple-800',
      recommended: 'bg-green-100 text-green-800',
      approved_conceptually: 'bg-emerald-100 text-emerald-800',
      implementation_planning: 'bg-teal-100 text-teal-800',
      archived: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'draft') return <Clock className="w-4 h-4" />;
    if (status === 'implementation_planning' || status === 'approved_conceptually') {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Workflow Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(proposal.status)} gap-2 px-3 py-1`}>
              {getStatusIcon(proposal.status)}
              {WORKFLOW_STAGE_LABELS[proposal.status]}
            </Badge>
            <span className="text-sm text-gray-600">
              {WORKFLOW_STAGE_DESCRIPTIONS[proposal.status]}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Proposal Completion</CardTitle>
              <CardDescription className="text-xs">
                {checklist.completed} of {checklist.total} requirements
              </CardDescription>
            </div>
            <span className="text-lg font-bold text-slate-900">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2 mt-2" />
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checklist.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <span className={item.completed ? 'text-gray-700' : 'text-gray-600'}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Workflow Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600 w-24">1. Draft</div>
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <span className="text-xs text-gray-600">Initial development</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600 w-24">2. Under Review</div>
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <span className="text-xs text-gray-600">Stakeholder feedback</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600 w-24">3. Evaluated</div>
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <span className="text-xs text-gray-600">Formal assessment</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600 w-24">4. Recommended</div>
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <span className="text-xs text-gray-600">Staff recommendation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600 w-24">5. Approved</div>
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <span className="text-xs text-gray-600">Leadership approval</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-slate-600 w-24">6. Implementation</div>
              <div className="flex-1 h-2 bg-gray-200 rounded" />
              <span className="text-xs text-gray-600">Active execution</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}