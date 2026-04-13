import { beforeEach, describe, expect, it, vi } from 'vitest';

const addDocMock = vi.fn();
const collectionMock = vi.fn();
const docMock = vi.fn();
const onSnapshotMock = vi.fn();
const queryMock = vi.fn();
const serverTimestampMock = vi.fn(() => 'ts');
const updateDocMock = vi.fn();
const whereMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  addDoc: (...args) => addDocMock(...args),
  collection: (...args) => collectionMock(...args),
  doc: (...args) => docMock(...args),
  onSnapshot: (...args) => onSnapshotMock(...args),
  query: (...args) => queryMock(...args),
  serverTimestamp: (...args) => serverTimestampMock(...args),
  updateDoc: (...args) => updateDocMock(...args),
  where: (...args) => whereMock(...args),
}));

vi.mock('./firebase', () => ({
  db: 'db',
}));

const createSnap = (id, createdAtValue) => ({
  id,
  data: () => ({
    userId: 'u1',
    name: id,
    createdAt: { toMillis: () => createdAtValue },
  }),
});

describe('tripService', () => {
  beforeEach(() => {
    addDocMock.mockReset();
    collectionMock.mockReset();
    docMock.mockReset();
    onSnapshotMock.mockReset();
    queryMock.mockReset();
    updateDocMock.mockReset();
    whereMock.mockReset();
    collectionMock.mockReturnValue('tripsCollectionRef');
    queryMock.mockReturnValue('tripQueryRef');
    whereMock.mockReturnValue('whereClause');
    docMock.mockReturnValue('tripDocRef');
  });

  it('creates trip with timestamps and destination', async () => {
    const { createTrip } = await import('./tripService');

    await createTrip('user-1', {
      name: 'Trip A',
      destination: { id: 'p1' },
      accommodation: null,
    });

    expect(collectionMock).toHaveBeenCalledWith('db', 'trips');
    expect(addDocMock).toHaveBeenCalledTimes(1);
    const payload = addDocMock.mock.calls[0][1];
    expect(payload.userId).toBe('user-1');
    expect(payload.name).toBe('Trip A');
    expect(payload.destination).toEqual({ id: 'p1' });
    expect(payload.createdAt).toBe('ts');
    expect(payload.updatedAt).toBe('ts');
  });

  it('updates trip with patch and updated timestamp', async () => {
    const { updateTrip } = await import('./tripService');

    await updateTrip('trip-1', { accommodation: { id: 'hotel-1' } });

    expect(docMock).toHaveBeenCalledWith('db', 'trips', 'trip-1');
    expect(updateDocMock).toHaveBeenCalledWith('tripDocRef', {
      accommodation: { id: 'hotel-1' },
      updatedAt: 'ts',
    });
  });

  it('subscribes and returns trips sorted by createdAt desc', async () => {
    const { subscribeTrips } = await import('./tripService');

    onSnapshotMock.mockImplementation((_, onData) => {
      onData({ docs: [createSnap('old', 1), createSnap('new', 99)] });
      return () => {};
    });

    const received = [];
    subscribeTrips('user-1', (trips) => received.push(trips), vi.fn());

    expect(queryMock).toHaveBeenCalled();
    expect(received).toHaveLength(1);
    expect(received[0][0].id).toBe('new');
    expect(received[0][1].id).toBe('old');
  });
});
