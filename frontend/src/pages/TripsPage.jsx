import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CalendarClock, BedDouble, Navigation2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useTravelData } from '../contexts/TravelDataContext';

const formatDate = (value) => {
  if (!value) return 'N/A';
  try {
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
  } catch (error) {
    console.error('Failed to format trip date', error);
  }
  return 'N/A';
};

const toTripPlaces = (trip) => {
  const places = [];
  if (trip?.destination) {
    places.push({
      id: `${trip.id}-destination`,
      type: 'Điểm đến',
      ...trip.destination,
    });
  }
  if (trip?.accommodation) {
    places.push({
      id: `${trip.id}-accommodation`,
      type: 'Nơi ở',
      ...trip.accommodation,
    });
  }
  return places;
};

export default function TripsPage() {
  const { trips, activeTripId, setActiveTripId } = useTravelData();
  const [localSelection, setLocalSelection] = useState(null);
  const navigate = useNavigate();

  const selectedId = localSelection || activeTripId || trips[0]?.id || null;
  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedId) || null,
    [selectedId, trips]
  );

  const tripPlaces = useMemo(() => toTripPlaces(selectedTrip), [selectedTrip]);

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Quản lý chuyến đi</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý hành trình và xem chi tiết các địa điểm đã đến.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 h-10 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Thoát
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-5">
          <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Danh sách chuyến đi</h2>
            {!trips.length ? (
              <div className="text-sm text-slate-500 bg-slate-50 rounded-2xl px-4 py-5">
                Chưa có chuyến đi nào. Hãy tạo chuyến đi từ trang bản đồ.
              </div>
            ) : (
              <div className="space-y-2">
                {trips.map((trip) => {
                  const isActive = selectedId === trip.id;
                  return (
                    <button
                      type="button"
                      key={trip.id}
                      onClick={() => {
                        setLocalSelection(trip.id);
                        setActiveTripId(trip.id);
                      }}
                      className={`w-full text-left rounded-2xl px-4 py-3 border transition-all duration-200 ease-in-out ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40'
                      }`}
                    >
                      <div className="font-medium text-slate-900 line-clamp-1">{trip.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{formatDate(trip.createdAt)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
            {!selectedTrip ? (
              <div className="h-full min-h-[320px] flex items-center justify-center text-slate-500 text-sm">
                Chọn một chuyến đi để xem chi tiết.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">{selectedTrip.name}</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <CalendarClock className="w-4 h-4" />
                      <span>Tạo lúc: {formatDate(selectedTrip.createdAt)}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-xl px-3 py-1 text-xs bg-cyan-100 text-cyan-800 border border-cyan-200">
                    {tripPlaces.length} địa điểm
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tripPlaces.map((place) => (
                    <article
                      key={place.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all duration-200 ease-in-out hover:border-cyan-200 hover:bg-cyan-50/60"
                    >
                      <div className="flex items-center gap-2 text-xs text-cyan-700 font-semibold uppercase tracking-wide">
                        {place.type === 'Nơi ở' ? <BedDouble className="w-4 h-4" /> : <Navigation2 className="w-4 h-4" />}
                        {place.type}
                      </div>
                      <h4 className="text-base font-semibold text-slate-900 mt-2 line-clamp-1">{place.name || 'Chưa có tên'}</h4>
                      <div className="text-sm text-slate-600 mt-1 line-clamp-2">{place.address || 'Không có địa chỉ'}</div>
                      {place.lat && place.lng ? (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{Number(place.lat).toFixed(5)}, {Number(place.lng).toFixed(5)}</span>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>

                {!tripPlaces.length ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Chuyến đi này chưa có địa điểm đến hoặc nơi ở. Bạn có thể cập nhật ở trang Trang chủ.
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
