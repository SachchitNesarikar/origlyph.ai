import React, { useEffect, useState } from 'react';
import { Clipboard, DoorOpen, UsersRound } from 'lucide-react';
import { api } from '../services/api';
import { RoomSessionResponse, RoomStateResponse } from '../types';
import { ArtifactViewer } from './ArtifactViewer';
import { MapGuess } from './MapGuess';

const ROOM_SESSION_KEY = 'origlyph.room-session';

interface SavedRoomSession {
  roomCode: string;
  playerToken: string;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export const RoomsPage: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState(
    () => new URLSearchParams(window.location.search).get('room')?.toUpperCase() || ''
  );
  const [session, setSession] = useState<RoomSessionResponse | null>(null);
  const [savedSession, setSavedSession] = useState<SavedRoomSession | null>(null);
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    let restored: SavedRoomSession | null = null;
    try {
      const saved = window.localStorage.getItem(ROOM_SESSION_KEY);
      if (saved) {
        restored = JSON.parse(saved) as SavedRoomSession;
        if (!restored.roomCode || !restored.playerToken) {
          throw new Error('Saved room session is incomplete.');
        }
      }
    } catch (restoreError) {
      setError(`Could not read the saved room session: ${errorMessage(restoreError)}`);
      return;
    }

    if (!restored) return;
    setSavedSession(restored);
    setRoomCodeInput(restored.roomCode);
    api.getRoom(restored.roomCode, restored.playerToken)
      .then((room) => {
        setSession({ player_token: restored!.playerToken, room });
        setSavedSession(null);
      })
      .catch((restoreError: unknown) => {
        setError(`Could not restore your room. You can retry or leave this saved session: ${errorMessage(restoreError)}`);
      });
  }, []);

  useEffect(() => {
    if (!session) return;
    let isCurrent = true;
    const refreshRoom = async () => {
      try {
        const room = await api.getRoom(session.room.room_code, session.player_token);
        if (isCurrent) setSession((current) => current && { ...current, room });
      } catch (refreshError) {
        if (isCurrent) setError(`Room update failed: ${errorMessage(refreshError)}`);
      }
    };
    const intervalId = window.setInterval(refreshRoom, 2500);
    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [session?.room.room_code, session?.player_token]);

  const saveSession = (newSession: RoomSessionResponse) => {
    setSession(newSession);
    setSavedSession(null);
    setRoomCodeInput(newSession.room.room_code);
    setUserGuess(null);
    setError(null);
    try {
      window.localStorage.setItem(
        ROOM_SESSION_KEY,
        JSON.stringify({
          roomCode: newSession.room.room_code,
          playerToken: newSession.player_token,
        } satisfies SavedRoomSession)
      );
    } catch (storageError) {
      setError(`Room opened, but this browser could not save your player token. Keep this tab open: ${errorMessage(storageError)}`);
    }
  };

  const createRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);
      saveSession(await api.createRoom(nickname));
    } catch (createError) {
      setError(`Could not create room: ${errorMessage(createError)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);
      saveSession(await api.joinRoom(roomCodeInput.trim().toUpperCase(), nickname));
    } catch (joinError) {
      setError(`Could not join room: ${errorMessage(joinError)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const retryRestore = async () => {
    if (!savedSession) return;
    try {
      setIsLoading(true);
      setError(null);
      const room = await api.getRoom(savedSession.roomCode, savedSession.playerToken);
      setSession({ player_token: savedSession.playerToken, room });
      setSavedSession(null);
    } catch (restoreError) {
      setError(`Could not restore your room: ${errorMessage(restoreError)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitGuess = async () => {
    if (!session || !userGuess) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const room = await api.submitRoomGuess(
        session.room.room_code,
        session.player_token,
        userGuess.lat,
        userGuess.lng
      );
      setSession((current) => current && { ...current, room });
    } catch (guessError) {
      setError(`Could not submit your guess: ${errorMessage(guessError)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRoomCode = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.room.room_code);
      setCopyMessage('Room code copied');
    } catch (clipboardError) {
      setError(`Could not copy the room code: ${errorMessage(clipboardError)}`);
    }
  };

  const leaveRoom = () => {
    setSession(null);
    setSavedSession(null);
    setUserGuess(null);
    setError(null);
    setCopyMessage(null);
    try {
      window.localStorage.removeItem(ROOM_SESSION_KEY);
    } catch (storageError) {
      setError(`Could not clear the saved room token: ${errorMessage(storageError)}`);
    }
  };

  const room = session?.room;

  return (
    <div className="page room-page">
      <div className="page-head">
        <div>
          <div className="page-kicker">Private rooms · up to 8 players</div>
          <h2 className="page-title"><UsersRound size={28} /> Play with friends</h2>
          <p className="page-lede">
            Share a room code, study the same artifact, and see who gets closest. Each player gets one guess.
          </p>
        </div>
      </div>

      {error && <div className="room-error" role="alert">{error}</div>}

      {!room && (
        <section className="room-lobby">
          {savedSession ? (
            <div className="room-lobby-card">
              <p>Your saved room is <strong>{savedSession.roomCode}</strong>.</p>
              <div className="room-form-actions">
                <button className="seal-btn" onClick={retryRestore} disabled={isLoading}>
                  {isLoading ? 'Rejoining…' : 'Rejoin room'}
                </button>
                <button className="ghost-btn" onClick={leaveRoom}>Leave saved room</button>
              </div>
            </div>
          ) : (
            <div className="room-lobby-card">
              <label className="room-field">
                Your nickname
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={24}
                  placeholder="e.g. Alex"
                  autoComplete="nickname"
                />
              </label>
              <label className="room-field">
                Room code to join
                <input
                  value={roomCodeInput}
                  onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="Optional · ABC123"
                  autoComplete="off"
                />
              </label>
              <div className="room-form-actions">
                <button className="seal-btn" onClick={createRoom} disabled={!nickname.trim() || isLoading}>
                  {isLoading ? 'Opening room…' : 'Create a room'}
                </button>
                <button
                  className="ghost-btn"
                  onClick={joinRoom}
                  disabled={!nickname.trim() || roomCodeInput.trim().length !== 6 || isLoading}
                >
                  Join with code
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {room && session && (
        <>
          <section className="room-banner">
            <div>
              <div className="page-kicker">Share this code with friends</div>
              <div className="room-code">{room.room_code}</div>
              <p>{room.player_count} of {room.capacity} players · scores update automatically</p>
            </div>
            <div className="room-banner-actions">
              <button className="ghost-btn" onClick={copyRoomCode}>
                <Clipboard size={15} /> Copy code
              </button>
              {copyMessage && <span className="room-copy-message" role="status">{copyMessage}</span>}
              <button className="ghost-btn" onClick={leaveRoom}>
                <DoorOpen size={15} /> Leave room
              </button>
            </div>
          </section>

          <div className="room-content">
            <div className="room-artifact">
              <ArtifactViewer artifact={room.artifact} />
              <section className="room-leaderboard">
                <h3>Room standings</h3>
                <ol>
                  {room.players.map((player) => (
                    <li key={player.nickname}>
                      <span>{player.nickname}{player.nickname === nickname.trim() ? ' · you' : ''}</span>
                      <strong>
                        {player.score !== null ? `${player.score.toLocaleString()} pts` : 'Guessing…'}
                      </strong>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <MapGuess
              userGuess={userGuess}
              onSelectCoordinates={setUserGuess}
              onSubmitGuess={submitGuess}
              revealData={room.own_guess}
              isSubmitting={isSubmitting}
              disabled={room.own_guess !== null}
            />
          </div>
        </>
      )}
    </div>
  );
};
