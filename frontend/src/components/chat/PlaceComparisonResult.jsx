import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const PLACE_LINK_REGEX = /\[([^\]]+)\]\(place:([^\)]+)\)/g;

function stripMarkdownPlaceLinks(value) {
  return String(value || '').replace(PLACE_LINK_REGEX, '$1').trim();
}

export function parsePlaceComparisonResponse(content) {
  const raw = String(content || '').trim();
  if (!raw) return null;

  const withoutFence = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(withoutFence);
    if (parsed?.type !== 'place_comparison') return null;
    return parsed;
  } catch {
    return null;
  }
}

function getValue(row, placeId) {
  const value = row?.values?.[placeId];
  return stripMarkdownPlaceLinks(value) || 'Chưa rõ';
}

function getNote(row, placeId) {
  return stripMarkdownPlaceLinks(row?.notes?.[placeId] || '');
}

export function PlaceComparisonTable({ data }) {
  const places = Array.isArray(data?.places) ? data.places.slice(0, 4) : [];
  const rows = Array.isArray(data?.comparisonRows) ? data.comparisonRows : [];
  const assessment = data?.overallAssessment || {};
  const hasEnoughData = data?.status !== 'insufficient_data' && places.length >= 2;

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-base-200 bg-white text-ink-900 shadow-soft">
      <div className="border-b border-base-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary-600 p-1.5 text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-ink-900">Đánh giá chi tiết</h3>
          </div>
        </div>
      </div>

      {!hasEnoughData ? (
        <div className="flex items-start gap-3 p-4 text-sm font-semibold leading-6 text-slate-600">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p>{stripMarkdownPlaceLinks(assessment.summary) || 'Bạn hãy tag ít nhất 2 địa điểm để AI so sánh.'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-[11px]">
            <thead>
              <tr className="text-slate-500">
                <th className="sticky left-0 z-10 w-28 border-b border-base-200 bg-white px-3 py-2 font-black uppercase tracking-wide">
                  Tiêu chí
                </th>
                {places.map((place) => (
                  <th key={place.id} className="min-w-36 border-b border-base-200 bg-white px-2 py-2">
                    <span className="block rounded-2xl bg-base-50 px-3 py-2 text-[11px] font-black leading-4 text-ink-900 ring-1 ring-base-200">
                      <span className="line-clamp-2">{stripMarkdownPlaceLinks(place.name)}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.key || row.label || index} className="align-top transition hover:bg-primary-50/35">
                  <th className="sticky left-0 z-10 border-b border-base-100 bg-white px-3 py-3 font-black leading-5 text-primary-700">
                    {stripMarkdownPlaceLinks(row.label) || 'Tiêu chí'}
                  </th>
                  {places.map((place) => {
                    const note = getNote(row, place.id);
                    return (
                      <td key={place.id} className="border-b border-base-100 px-3 py-3 text-slate-700">
                        <div className="font-bold leading-5 text-ink-900">{getValue(row, place.id)}</div>
                        {note ? <div className="mt-1.5 rounded-xl bg-base-50 px-2 py-1 text-[10px] font-semibold leading-4 text-slate-500">{note}</div> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Array.isArray(data?.dataNotes) && data.dataNotes.length ? (
        <div className="space-y-1 border-t border-base-200 bg-base-50/80 px-4 py-3 text-[10px] font-semibold leading-4 text-slate-500">
          {data.dataNotes.slice(0, 3).map((note, index) => (
            <div key={index}>Lưu ý: {stripMarkdownPlaceLinks(note)}</div>
          ))}
        </div>
      ) : null}

    </div>
  );
}

export function PlaceComparisonAnalysis({ data }) {
  const places = Array.isArray(data?.places) ? data.places.slice(0, 4) : [];
  const assessment = data?.overallAssessment || {};
  const hasEnoughData = data?.status !== 'insufficient_data' && places.length >= 2;

  return (
    <div className="space-y-3">
      {!hasEnoughData ? (
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p>{stripMarkdownPlaceLinks(assessment.summary) || 'Bạn hãy tag ít nhất 2 địa điểm để AI so sánh.'}</p>
        </div>
      ) : (
        <>
          <p>{stripMarkdownPlaceLinks(assessment.summary) || 'Chưa có đủ dữ liệu để đưa ra đánh giá tổng thể.'}</p>

          {assessment.recommendedPlaceName ? (
            <div className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <div>
                <div className="text-[11px] font-black uppercase tracking-wide text-emerald-200">Gợi ý nổi bật</div>
                <div className="mt-0.5 font-black text-white">{stripMarkdownPlaceLinks(assessment.recommendedPlaceName)}</div>
              </div>
            </div>
          ) : null}

          {Array.isArray(assessment.reasons) && assessment.reasons.length ? (
            <div>
              <div className="mb-1 font-black">Lý do</div>
              <ul className="space-y-1">
                {assessment.reasons.slice(0, 4).map((reason, index) => (
                  <li key={index}>- {stripMarkdownPlaceLinks(reason)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(assessment.bestFor) && assessment.bestFor.length ? (
            <div>
              <div className="mb-1 font-black">Phù hợp nhất khi</div>
              <ul className="space-y-1">
                {assessment.bestFor.slice(0, 4).map((item, index) => (
                  <li key={`${item.placeId || index}-${index}`}>
                    - <span className="font-black text-primary-200">{stripMarkdownPlaceLinks(item.placeName)}:</span>{' '}
                    {stripMarkdownPlaceLinks(item.scenario)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(assessment.tradeoffs) && assessment.tradeoffs.length ? (
            <div>
              <div className="mb-1 font-black">Cần cân nhắc</div>
              <ul className="space-y-1">
                {assessment.tradeoffs.slice(0, 4).map((tradeoff, index) => (
                  <li key={index}>- {stripMarkdownPlaceLinks(tradeoff)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {data?.followUpQuestion ? (
        <div className="border-t border-white/10 pt-2 text-[12px] font-semibold text-primary-100">
          {stripMarkdownPlaceLinks(data.followUpQuestion)}
        </div>
      ) : null}
    </div>
  );
}

export default PlaceComparisonAnalysis;
