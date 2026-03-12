import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { pathname } = useLocation();

  const handleSubmit = async () => {
    if (!category || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.integrations.Core.SendEmail({
        to: 'feedback@machias.local',
        subject: `Machias Platform Feedback - ${category}`,
        body: `
User: ${user.email}
Category: ${category}
Page: ${pathname}
Time: ${new Date().toLocaleString()}

Message:
${message}
        `,
      });
      toast.success('Feedback sent! Thank you.');
      setMessage('');
      setCategory('');
      setOpen(false);
    } catch (err) {
      console.error('Feedback submission error:', err);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          color: '#E7D0B1',
          background: 'rgba(255,255,255,0.05)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        title="Send feedback or report an issue"
      >
        <MessageCircle className="h-4 w-4" />
        <span>Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Feedback</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug / Error</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="data">Data Correction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                Message
              </label>
              <Textarea
                placeholder="Describe your feedback or the issue you found..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-32 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Page context: {pathname}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !category || !message.trim()}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}