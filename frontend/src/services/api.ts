import {
  Artifact,
  ArtifactChallengeView,
  GuessResponse,
  HealthResponse,
  HintResponse,
  ProvenanceGraphResponse,
  RoomSessionResponse,
  RoomStateResponse,
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) errorMsg = errorJson.detail;
      } catch {
        // use default error message
      }
      throw new ApiError(res.status, errorMsg);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new Error(`Failed connecting to Origlyph backend: ${err.message}`);
  }
}

export const api = {
  getHealth: () => request<HealthResponse>('/health'),

  getManifest: () => request<any>('/manifest'),

  listArtifacts: (playableOnly = false) =>
    request<ArtifactChallengeView[]>(`/artifacts?playable_only=${playableOnly}`),

  getArtifact: (id: string, reveal = false) =>
    request<ArtifactChallengeView | Artifact>(`/artifacts/${id}?reveal=${reveal}`),

  getHint: (id: string, hintLevel: number) =>
    request<HintResponse>(`/artifacts/${id}/hint`, {
      method: 'POST',
      body: JSON.stringify({ hint_level: hintLevel }),
    }),

  submitGuess: (id: string, latitude: number, longitude: number, hintsUsed: number) =>
    request<GuessResponse>(`/artifacts/${id}/guess`, {
      method: 'POST',
      body: JSON.stringify({
        latitude,
        longitude,
        hints_used: hintsUsed,
      }),
    }),

  getRelations: (id: string) =>
    request<ProvenanceGraphResponse>(`/artifacts/${id}/relations`),

  createRoom: (nickname: string) =>
    request<RoomSessionResponse>('/rooms', {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    }),

  joinRoom: (roomCode: string, nickname: string) =>
    request<RoomSessionResponse>(`/rooms/${encodeURIComponent(roomCode)}/join`, {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    }),

  getRoom: (roomCode: string, playerToken: string) =>
    request<RoomStateResponse>(`/rooms/${encodeURIComponent(roomCode)}`, {
      headers: { 'X-Room-Token': playerToken },
    }),

  submitRoomGuess: (roomCode: string, playerToken: string, latitude: number, longitude: number) =>
    request<RoomStateResponse>(`/rooms/${encodeURIComponent(roomCode)}/guess`, {
      method: 'POST',
      headers: { 'X-Room-Token': playerToken },
      body: JSON.stringify({ latitude, longitude }),
    }),

  narrateArtifact: async (id: string) => {
    const res = await fetch(`${API_BASE}/artifacts/${id}/narrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      let msg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) msg = errorJson.detail;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    return res.blob();
  },

  getGlobalProvenance: () =>
    request<{ nodes: any[]; edges: any[] }>('/provenance/global'),
};
