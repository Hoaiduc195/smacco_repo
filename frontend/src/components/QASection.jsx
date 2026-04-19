import React from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function QASection({ placeId }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          Q&A Platform
        </h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Ask a Question
        </button>
      </div>

      <div className="min-h-[200px] flex flex-col items-center justify-center text-center space-y-3 py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <MessageSquare className="w-8 h-8 text-gray-300" />
        </div>
        <div>
          <h3 className="text-gray-900 font-semibold">No questions yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Be the first to ask about this place! Others in the community will help you out.
          </p>
        </div>
        <button className="mt-2 text-blue-600 font-medium hover:underline text-sm">
          Start the conversation
        </button>
      </div>

      <div className="pt-4 text-xs text-gray-400 text-center italic">
        The QA Platform is coming soon. Stay tuned for real-time answers from locals and AI insights!
      </div>
    </div>
  );
}
