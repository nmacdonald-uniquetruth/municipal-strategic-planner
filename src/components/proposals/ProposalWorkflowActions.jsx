import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';
import {
  WORKFLOW_STAGES,
  WORKFLOW_STAGE_LABELS,
  getAllowedStatusTransitions,
  validateWorkflowAdvance,
  getWorkflowRequirements,
} from './workflowValidator';

export default function ProposalWorkflowActions({ proposal, evaluation, onStatusChange }) {
  const [expandedErrors, setExpandedErrors] = useState(false);
  const allowedTransitions = getAllowedStatusTransitions(proposal.status);
  const requirements = getWorkflowRequirements(proposal.status);

  const handleStatusChange = (newStatus) => {
    const validation = validateWorkflowAdvance(proposal, evaluation, newStatus);

    if (!validation.valid) {
      setExpandedErrors(true);
      return;
    }

    onStatusChange(newStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Workflow Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <p className="text-xs text-gray-600 mb-2">Current Status</p>
          <p className="font-semibold text-slate-900">
            {WORKFLOW_STAGE_LABELS[proposal.status]}
          </p>
        </div>

        {/* Requirements for current status */}
        {requirements.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-2">Requirements for this stage:</p>
            <ul className="space-y-1">
              {requirements.map((req, idx) => (
                <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                  <span>•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Available transitions */}
        <div>
          <p className="text-xs text-gray-600 mb-2">Next Steps</p>
          <div className="space-y-2">
            {allowedTransitions.length > 0 ? (
              allowedTransitions.map(nextStatus => {
                const validation = validateWorkflowAdvance(proposal, evaluation, nextStatus);
                const canAdvance = validation.valid;

                return (
                  <div key={nextStatus}>
                    <Button
                      onClick={() => handleStatusChange(nextStatus)}
                      variant={canAdvance ? 'default' : 'outline'}
                      className={`w-full justify-between ${
                        canAdvance
                          ? 'bg-slate-900 hover:bg-slate-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }`}
                      disabled={!canAdvance}
                    >
                      <span className="flex items-center gap-2">
                        <span>{WORKFLOW_STAGE_LABELS[nextStatus]}</span>
                      </span>
                      {canAdvance && <ArrowRight className="w-4 h-4" />}
                    </Button>

                    {/* Show blocking errors if any */}
                    {!canAdvance && validation.errors.length > 0 && (
                      <div className="mt-1 text-xs">
                        <button
                          onClick={() => setExpandedErrors(!expandedErrors)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1 w-full"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>{validation.errors.length} requirement(s) not met</span>
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${
                              expandedErrors ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {expandedErrors && (
                          <div className="mt-2 space-y-1 bg-red-50 p-2 rounded border border-red-200">
                            {validation.errors.map((error, idx) => (
                              <p key={idx} className="text-red-700 text-xs">
                                • {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-600">No further transitions available</p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-700">
            <strong>Note:</strong> All proposals must complete formal evaluation before being marked as recommended. 
            This ensures rigorous analysis of financial impact, risks, and tax implications.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}