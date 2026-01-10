import { useEffect, useState, useRef, useMemo } from 'react'
import {
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
} from '@100mslive/react-sdk'
import {
  GraduationCap,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import { useApi } from '../../services/api'
import './LiveClassRoom.css'

interface LiveClassRoomProps {
  sessionData: {
    sessionId: number
    facultyId: string
    batchName?: string
    courseName?: string
    hms: {
      authToken: string
    }
  }
  onClose: (options?: { sessionId?: number }) => void
}

const LiveClassRoom: React.FC<LiveClassRoomProps> = ({ sessionData, onClose }) => {
  const hmsActions = useHMSActions()
  const api = useApi()

  const isConnected = useHMSStore(selectIsConnectedToRoom)
  const peers = useHMSStore(selectPeers)
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled)
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled)

  const [isJoining, setIsJoining] = useState(true)
  const [error, setError] = useState('')
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [connectionEstablished, setConnectionEstablished] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const visiblePeers = useMemo(
    () => peers.filter(peer => !(peer as any).isAuxiliary && !/beam/i.test(peer.name)),
    [peers]
  )

  const joinAttemptedRef = useRef(false)
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isConnectedRef = useRef(false)
  const uiFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    isConnectedRef.current = isConnected || false

    const actuallyConnected = isConnected || connectionEstablished || peers.length > 0

    if (actuallyConnected && isJoining) {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      if (fallbackCheckRef.current) {
        clearTimeout(fallbackCheckRef.current)
        fallbackCheckRef.current = null
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      setIsJoining(false)
    }
  }, [isConnected, isJoining, connectionEstablished, peers.length, peers])

  useEffect(() => {
    if (peers.length > 0 && isJoining && !connectionEstablished) {
      setConnectionEstablished(true)
    }
  }, [peers.length, isJoining, connectionEstablished])

  useEffect(() => {
    if (sessionData?.hms?.authToken && !joinAttemptedRef.current) {
      joinAttemptedRef.current = true
      joinRoom(sessionData.hms.authToken)
    }

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
      if (fallbackCheckRef.current) {
        clearTimeout(fallbackCheckRef.current)
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (isConnected || connectionEstablished) {
        hmsActions.leave().catch(console.error)
      }
    }
  }, [sessionData?.hms?.authToken])

  const joinRoom = async (authToken: string) => {
    try {
      let checkCount = 0
      const maxChecks = 5
      checkIntervalRef.current = setInterval(() => {
        checkCount++

        if (checkCount >= maxChecks) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
          if (fallbackCheckRef.current) {
            clearTimeout(fallbackCheckRef.current)
            fallbackCheckRef.current = null
          }
        }
      }, 2000)

      fallbackCheckRef.current = setTimeout(() => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
        fallbackCheckRef.current = null
      }, 10000)

      connectionTimeoutRef.current = setTimeout(() => {
        if (!isConnectedRef.current && !isConnected && !connectionEstablished && peers.length === 0) {
          console.error('❌ Connection timeout - failed to connect within 30 seconds')
          setError('Connection timeout. Please try again or check your network connection.')
          setIsJoining(false)
          joinAttemptedRef.current = false
          hmsActions.leave().catch(console.error)
        }
      }, 30000)

      await hmsActions.join({
        authToken: authToken,
        userName: sessionData?.batchName || 'Tutor'
      })

      if (uiFallbackRef.current) {
        clearTimeout(uiFallbackRef.current)
      }
      uiFallbackRef.current = setTimeout(() => {
        if (isJoining) {
          setIsJoining(false)
        }
      }, 12000)
    } catch (err: any) {
      console.error('❌ Error joining room:', err)

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }
      if (fallbackCheckRef.current) {
        clearTimeout(fallbackCheckRef.current)
        fallbackCheckRef.current = null
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }

      setError(err.message || 'Failed to join room. Please try again.')
      setIsJoining(false)
    }
  }

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const results = await Promise.allSettled([
          // @ts-ignore
          navigator.permissions?.query?.({ name: 'camera' as any }),
          // @ts-ignore
          navigator.permissions?.query?.({ name: 'microphone' as any })
        ])
        const states = results
          .map((r: any) => (r?.status === 'fulfilled' ? r.value?.state : undefined))
          .filter(Boolean)
        if (states.includes('denied')) {
          setError('Camera/Microphone permission denied. Please allow permissions and retry.')
          setIsJoining(false)
        }
      } catch (_) {
      }
    }
    checkPermissions()
  }, [])

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled)
  }

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled)
  }

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await hmsActions.setScreenShareEnabled(false)
        setIsScreenSharing(false)
      } else {
        await hmsActions.setScreenShareEnabled(true)
        setIsScreenSharing(true)
      }
    } catch (err: any) {
      const message: string = String(err?.message || err)
      const name: string = String(err?.name || '')

      const isUserCancel =
        name === 'NotAllowedError' ||
        name === 'AbortError' ||
        /denied|permission|cancel/i.test(message)

      if (isUserCancel) {
        setIsScreenSharing(false)
        return
      }

      console.error('Error toggling screen share:', err)
      setError('Failed to toggle screen sharing')
    }
  }

  const leaveRoom = async () => {
    if (isLeaving) return

    setIsLeaving(true)

    try {
      try {
        await hmsActions.endRoom('Session ended by mentor', true)
        console.log('✅ Room ended for all participants')
      } catch (endRoomErr: any) {
        console.warn('⚠️ Could not end room via HMS (may not have permission):', endRoomErr?.message)
      }

      await api.multimedia.sessions.endSession(sessionData.sessionId, sessionData.facultyId)
    } catch (err: any) {
      console.error('❌ Error ending Multimedia session:', err.response?.data?.message || err.message)
    }

    try {
      await api.lms.sessions.markComplete(sessionData.sessionId)
    } catch (markErr: any) {
      console.error('⚠️ Failed to mark session complete in LMS:', markErr?.response?.data?.message || markErr?.message)
    }

    await hmsActions.leave()
    onClose({ sessionId: sessionData.sessionId })
  }

  if (error) {
    return (
      <div className="live-class-error">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => onClose()} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    )
  }

  if (isJoining) {
    return (
      <div className="live-class-loading">
        <div className="loading-spinner"></div>
        <p>Joining live class...</p>
      </div>
    )
  }

  return (
    <div className="live-class-room">
      <div className="room-header">
        <div className="room-info">
          <h2>{sessionData?.batchName || sessionData?.courseName || 'Live Class'}</h2>
          <span className="live-badge">● LIVE</span>
        </div>
        <div className="room-stats">
          <span className="peer-count icon-text">
            <Users size={18} />
            <span>{visiblePeers.length} participants</span>
          </span>
        </div>
      </div>

      <div className={`video-container ${peers.some(p => p.auxiliaryTracks?.length > 0) ? 'screen-share-active' : ''}`}>
        {/* Screen Share View */}
        {peers.some(peer => peer.auxiliaryTracks?.length > 0) && (
          <div className="screen-share-container">
            {peers
              .filter(peer => peer.auxiliaryTracks && peer.auxiliaryTracks.length > 0)
              .map(peer => (
                <div key={`${peer.id}-screen`} className="screen-share-main">
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={node => {
                      if (!node) return;
                      const screenTrack = peer.auxiliaryTracks?.[0];
                      if (screenTrack) {
                        try {
                          hmsActions.attachVideo(screenTrack, node);
                        } catch (err) {
                          console.error('Failed to attach screen share track:', err);
                        }
                      }
                    }}
                    className="screen-share-video"
                  />
                  <div className="screen-share-label">
                    <ScreenShare size={20} />
                    <span>{peer.name}'s Screen</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {visiblePeers.length === 0 && !peers.some(p => p.auxiliaryTracks?.length > 0) ? (
          <div className="no-peers">
            <p>Waiting for students to join...</p>
          </div>
        ) : (
          <div className={`video-grid ${peers.some(p => p.auxiliaryTracks?.length > 0) ? 'compact' : ''}`}>
            {visiblePeers.map((peer) => (
              <div key={peer.id} className="video-tile">
                <video
                  autoPlay
                  muted={peer.isLocal}
                  playsInline
                  ref={(node) => {
                    if (node && peer.videoTrack) {
                      hmsActions.attachVideo(peer.videoTrack, node)
                    }
                  }}
                  className="peer-video"
                />
                <div className="peer-info">
                  <span className="peer-name">{peer.name}</span>
                  <div className="track-debug">
                    <span className="icon-label">
                      {peer.audioTrack && (peer.audioTrack.enabled === undefined || peer.audioTrack.enabled !== false) ? <Mic size={14} /> : <MicOff size={14} />}
                      <span>{peer.audioTrack && (peer.audioTrack.enabled === undefined || peer.audioTrack.enabled !== false) ? 'On' : 'Muted'}</span>
                    </span>
                    <span className="icon-label">
                      {peer.videoTrack && (peer.videoTrack.enabled === undefined || peer.videoTrack.enabled !== false) ? <Video size={14} /> : <VideoOff size={14} />}
                      <span>{peer.videoTrack && (peer.videoTrack.enabled === undefined || peer.videoTrack.enabled !== false) ? 'On' : 'Off'}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="room-controls">
        <button
          onClick={toggleAudio}
          className={`control-btn ${!isLocalAudioEnabled ? 'disabled' : ''}`}
        >
          {isLocalAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`control-btn ${!isLocalVideoEnabled ? 'disabled' : ''}`}
        >
          {isLocalVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`control-btn ${isScreenSharing ? 'active' : ''} ${peers.some(p => p.auxiliaryTracks?.length > 0 && !p.isLocal) ? 'disabled' : ''}`}
          disabled={peers.some(p => p.auxiliaryTracks?.length > 0 && !p.isLocal)}
          title={
            peers.some(p => p.auxiliaryTracks?.length > 0 && !p.isLocal)
              ? 'Someone is already sharing their screen'
              : isScreenSharing
                ? 'Stop sharing screen'
                : 'Share screen'
          }
        >
          {isScreenSharing ? <ScreenShare size={24} /> : <ScreenShareOff size={24} />}
        </button>

        <button
          onClick={() => setShowParticipants(prev => !prev)}
          className={`control-btn participants-btn ${showParticipants ? 'active' : ''}`}
        >
          <Users size={24} />
        </button>

        <button
          onClick={leaveRoom}
          className="control-btn leave-btn"
          disabled={isLeaving}
        >
          {isLeaving ? (
            'Ending...'
          ) : (
            <>
              <PhoneOff size={20} />
              <span>End Session</span>
            </>
          )}
        </button>
      </div>

      <div className="room-footer">
        <p className="recording-notice">
          ⏺ This session is being recorded
        </p>
      </div>

      {showParticipants && (
        <>
          <div className="participants-overlay" onClick={() => setShowParticipants(false)} />
          <aside className="participants-sidebar">
            <div className="participants-header">
              <span>Participants ({visiblePeers.length})</span>
              <button className="close-btn" onClick={() => setShowParticipants(false)}>✕</button>
            </div>
            <ul className="participants-list">
              {visiblePeers.map((peer) => (
                <li key={`mentor-participant-${peer.id}`}>
                  <span className="participant-name">
                    {peer.name}
                    {peer.roleName === 'tutor' && (
                      <GraduationCap size={16} className="icon-inline" />
                    )}
                    {peer.isLocal && ' (You)'}
                  </span>
                  <span className="participant-status">
                    <span className="icon-label">
                      {peer.audioTrack && (peer.audioTrack.enabled === undefined || peer.audioTrack.enabled !== false) ? <Mic size={14} /> : <MicOff size={14} />}
                      <span>{peer.audioTrack && (peer.audioTrack.enabled === undefined || peer.audioTrack.enabled !== false) ? 'On' : 'Muted'}</span>
                    </span>
                    <span className="icon-label">
                      {peer.videoTrack && (peer.videoTrack.enabled === undefined || peer.videoTrack.enabled !== false) ? <Video size={14} /> : <VideoOff size={14} />}
                      <span>{peer.videoTrack && (peer.videoTrack.enabled === undefined || peer.videoTrack.enabled !== false) ? 'On' : 'Off'}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </>
      )}
    </div>
  )
}

export default LiveClassRoom

