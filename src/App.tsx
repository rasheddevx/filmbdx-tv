import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Share2, 
  Send, 
  Pause, 
  Volume2,
  VolumeX, 
  Maximize, 
  RefreshCcw, 
  Search, 
  ChevronDown,
  Eye,
  Users,
  Clock,
  Activity,
  CheckCircle2,
  LineChart,
  Handshake,
  Check,
  Calendar,
  Trophy,
  Sun,
  Download
} from 'lucide-react';
import { ref, onValue, update, push, onDisconnect, set, remove } from "firebase/database";
import { db } from "./firebase";
import clsx from 'clsx';
import { matchSchedule } from './data/schedule';

interface Channel {
  id: string;
  name: string;
  logoUrl: string;
  streamType: string;
  streamUrl: string;
}

interface MatchData {
  id: string;
  question: string;
  matchTime: string;
  status: string;
  hasDrawOption: boolean;
  drawVotes: number;
  teamA: {
    name: string;
    flag: string;
    votes: number;
  };
  teamB: {
    name: string;
    flag: string;
    votes: number;
  };
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [predictionData, setPredictionData] = useState<{ isSystemActive: boolean, matchData: MatchData } | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [qualities, setQualities] = useState<{height: number, level: number}[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const hlsRef = useRef<Hls | null>(null);

  // Auto-detect if proxy is supported (Netlify/Vercel/static hosting will bypass proxy and play directly)
  const [isProxySupported, setIsProxySupported] = useState<boolean>(() => {
    const isStaticHost = typeof window !== 'undefined' && (
      window.location.hostname.includes('netlify.app') || 
      window.location.hostname.includes('github.io') ||
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('pages.dev')
    );
    return !isStaticHost;
  });

  useEffect(() => {
    fetch('/api/proxy/stream')
      .then(res => {
        // If 400 or 200/OK but not serving main HTML, proxy works
        if (res.status === 400) {
          setIsProxySupported(true);
        } else {
          setIsProxySupported(false);
        }
      })
      .catch(() => {
        setIsProxySupported(false);
      });
  }, []);

  // Gesture Controls State
  const [brightness, setBrightness] = useState<number>(1);
  const [showOverlay, setShowOverlay] = useState<{type: 'brightness' | 'volume', value: number} | null>(null);
  
  const touchStartRef = useRef<{ y: number, x: number, type: 'brightness' | 'volume' | null, initialValue: number }>({ y: 0, x: 0, type: null, initialValue: 0 });
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    
    // Use a stable session ID for this browser tab
    let sessionId = sessionStorage.getItem('viewer_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('viewer_session_id', sessionId);
    }
    
    const activeViewersRef = ref(db, 'active_viewers');
    const myViewerRef = ref(db, `active_viewers/${sessionId}`);

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When I disconnect, remove this device
        onDisconnect(myViewerRef).remove().catch(console.error);
        // Add this device
        set(myViewerRef, true);
      }
    });

    const unsubscribeActiveViewers = onValue(activeViewersRef, (snap) => {
      if (snap.exists()) {
        const count = Object.keys(snap.val()).length;
        setViewerCount(count);
      } else {
        setViewerCount(0);
      }
    });

    return () => {
      unsubscribeConnected();
      unsubscribeActiveViewers();
      // Remove on cleanup (when component unmounts)
      remove(myViewerRef).catch(console.error);
    };
  }, []);

  useEffect(() => {
    const channelsRef = ref(db, 'channels');
    const unsubscribeChannels = onValue(channelsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const channelArray = Object.values(data) as Channel[];
        setChannels(channelArray);
        setSelectedChannel(prev => prev ? channelArray.find(c => c.id === prev.id) || channelArray[0] : channelArray[0]);
      } else {
        setChannels([]);
      }
    });

    const predictionRef = ref(db, 'prediction');
    const unsubscribePrediction = onValue(predictionRef, (snapshot) => {
      setPredictionData(snapshot.val());
    });

    return () => {
      unsubscribeChannels();
      unsubscribePrediction();
    };
  }, []);

  useEffect(() => {
    if (predictionData?.matchData) {
      const matchData = predictionData.matchData;
      const storageKey = `voted_${matchData.id}_${matchData.teamA.name}_${matchData.teamB.name}`;
      let voted = localStorage.getItem(storageKey);
      
      if (!voted) {
        const oldKey = `voted_${matchData.id}`;
        const oldVoted = localStorage.getItem(oldKey);
        if (oldVoted) {
          voted = oldVoted;
          localStorage.setItem(storageKey, oldVoted);
          localStorage.removeItem(oldKey);
        }
      }

      if (voted) {
        let isValid = true;
        if (voted === 'teamA' && matchData.teamA.votes === 0) isValid = false;
        if (voted === 'teamB' && matchData.teamB.votes === 0) isValid = false;
        if (voted === 'draw' && matchData.drawVotes === 0) isValid = false;

        if (isValid) {
          setUserVote(voted);
        } else {
          localStorage.removeItem(storageKey);
          setUserVote(null);
        }
      } else {
        setUserVote(null);
      }
    }
  }, [predictionData?.matchData]);

  useEffect(() => {
    let hls: Hls;

    const getProxiedUrl = (url: string) => {
      // If server-side stream proxy is not available/supported (e.g. Netlify/Vercel static environments), bypass proxy completely!
      if (!isProxySupported) {
        return url;
      }

      // Skip proxy for Akamai and other known direct-play CDNs to avoid datacenter IP blocks
      if (url.includes('akamaized.net')) {
        return url;
      }

      let referer = 'https://www.rtbgo.bn/';
      try {
        const originUrl = new URL(url);
        // Use generic origin if not rtbgo specifically
        if (!url.includes('rtbgo')) {
          referer = originUrl.origin + '/';
        }
      } catch(e) {}
      
      return `/api/proxy/stream?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
    };

    const initPlayer = () => {
      const video = videoRef.current;
      if (!video) return;
      if (!selectedChannel || selectedChannel.streamType === 'embed') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      const proxiedStreamUrl = getProxiedUrl(selectedChannel.streamUrl);

      if (Hls.isSupported()) {
        hls = new Hls({
          startLevel: -1 // Initial level, let manifest parse first
        });
        hlsRef.current = hls;
        hls.loadSource(proxiedStreamUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          setIsLoading(false);
          const availableQualities = data.levels.map((l, index) => ({
            height: l.height,
            level: index
          })).sort((a, b) => b.height - a.height); // Sort descending
          setQualities(availableQualities);
          
          // Force highest quality by default as requested
          if (data.levels.length > 0) {
            const highestLevel = availableQualities[0].level;
            hls.currentLevel = highestLevel;
            setCurrentQuality(highestLevel);
          } else {
            setCurrentQuality(-1);
          }
          
          video.play().catch(e => console.log("Auto-play blocked", e));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
             console.error("HLS fatal error", data);
             setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxiedStreamUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          video.play().catch(e => console.log("Auto-play blocked", e));
        });
      }
    };

    initPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [selectedChannel, isProxySupported]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !videoRef.current) return;
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    
    touchStartRef.current = {
      y: touch.clientY,
      x: touch.clientX,
      type: isLeftHalf ? 'brightness' : 'volume',
      initialValue: isLeftHalf ? brightness : videoRef.current.volume
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current.type || !videoRef.current) return;
    
    // Prevent scrolling when swiping on the player
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const change = deltaY / rect.height; 
    
    const newValue = Math.min(Math.max(touchStartRef.current.initialValue + change, 0), 1);
    
    if (touchStartRef.current.type === 'brightness') {
      setBrightness(newValue);
      setShowOverlay({ type: 'brightness', value: newValue });
    } else {
      videoRef.current.volume = newValue;
      if (newValue === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
      setShowOverlay({ type: 'volume', value: newValue });
    }
    
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => {
      setShowOverlay(null);
    }, 1000);
  };

  const handleTouchEnd = () => {
    touchStartRef.current.type = null;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
      setShowQualityMenu(false);
    }
  };

  const getQualityText = (level: number) => {
    if (level === -1) return "Auto (Source)";
    const q = qualities.find(q => q.level === level);
    return q ? `${q.height}p` : "Unknown";
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleVote = (option: 'teamA' | 'teamB' | 'draw') => {
    if (!predictionData?.matchData) return;
    if (userVote === option) return;
    
    const previousVote = userVote;
    setUserVote(option); // Optimistic UI
    const storageKey = `voted_${predictionData.matchData.id}_${predictionData.matchData.teamA.name}_${predictionData.matchData.teamB.name}`;
    localStorage.setItem(storageKey, option);

    const matchData = predictionData.matchData;
    const updates: Record<string, any> = {};

    if (previousVote === 'teamA') {
      updates['prediction/matchData/teamA/votes'] = Math.max(0, matchData.teamA.votes - 1);
    } else if (previousVote === 'teamB') {
      updates['prediction/matchData/teamB/votes'] = Math.max(0, matchData.teamB.votes - 1);
    } else if (previousVote === 'draw') {
      updates['prediction/matchData/drawVotes'] = Math.max(0, matchData.drawVotes - 1);
    }

    if (option === 'teamA') {
      updates['prediction/matchData/teamA/votes'] = (updates['prediction/matchData/teamA/votes'] ?? matchData.teamA.votes) + 1;
    } else if (option === 'teamB') {
      updates['prediction/matchData/teamB/votes'] = (updates['prediction/matchData/teamB/votes'] ?? matchData.teamB.votes) + 1;
    } else if (option === 'draw') {
      updates['prediction/matchData/drawVotes'] = (updates['prediction/matchData/drawVotes'] ?? matchData.drawVotes) + 1;
    }

    update(ref(db), updates).catch(err => {
      console.error("Failed to vote:", err);
    });
  };

  // Compute prediction stats
  let totalVotes = 0;
  let teamAPct = 0;
  let teamBPct = 0;
  let drawPct = 0;
  let winningTeamName = "Teams";

  if (predictionData?.matchData) {
    const d = predictionData.matchData;
    totalVotes = d.teamA.votes + d.teamB.votes + (d.hasDrawOption ? d.drawVotes : 0);
    if (totalVotes > 0) {
      teamAPct = Math.round((d.teamA.votes / totalVotes) * 100);
      teamBPct = Math.round((d.teamB.votes / totalVotes) * 100);
      drawPct = Math.round((d.drawVotes / totalVotes) * 100);
    }
    
    // Find who has highest chance
    if (d.teamA.votes > d.teamB.votes && d.teamA.votes > d.drawVotes) {
      winningTeamName = d.teamA.name;
    } else if (d.teamB.votes > d.teamA.votes && d.teamB.votes > d.drawVotes) {
      winningTeamName = d.teamB.name;
    } else if (d.hasDrawOption && d.drawVotes > d.teamA.votes && d.drawVotes > d.teamB.votes) {
      winningTeamName = `Draw`;
    }
  }

  const formatVotes = (votes: number) => {
    if (votes >= 1000) return (votes / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return votes.toString();
  };

  const [countdown, setCountdown] = useState("00h 00m 00s");

  useEffect(() => {
    if (!predictionData?.matchData) return;
    const updateCountdown = () => {
      const matchTime = new Date(predictionData.matchData.matchTime).getTime();
      const now = new Date().getTime();
      const difference = matchTime - now;

      if (difference <= 0) {
        setCountdown('LIVE');
        return;
      }

      if (difference > 0) {
        const h = Math.floor(difference / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [predictionData?.matchData?.matchTime]);

  return (
    <div className="min-h-screen bg-[#0A101C] text-slate-200 font-sans pb-12 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[#0F172A]/50 min-h-screen flex flex-col relative shadow-xl">
        
        {/* Sticky Top Section */}
        <div className="sticky top-0 z-50 w-full bg-[#111827] shadow-2xl rounded-b-xl">
          {/* Header */}
          <header className="flex items-center justify-between py-2.5 px-4 bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center translate-y-[1px]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 5.8C6 3.6 8.3 2.4 10.1 3.4L18.8 8.4C20.6 9.4 20.6 12.2 18.8 13.2L10.1 18.2C8.3 19.2 6 18 6 15.8V5.8Z" stroke="#E2B720" strokeWidth="4.5" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-[20px] tracking-tight leading-tight -ml-0.5">
                Film<span className="text-[#E2B720]">BDX</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://github.com/rasheddevx/filmbdx-app/releases/download/v1.0/FiFa-FilmBDX.1.0_1.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#E2B720] hover:bg-[#F2C730] transition px-3 py-1.5 rounded-lg text-slate-900 font-bold text-xs flex items-center gap-1.5 justify-center mr-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download App
            </a>
            <button className="bg-[#1F2937] hover:bg-[#374151] transition p-2 rounded-lg text-slate-300">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button className="bg-[#1F2937] hover:bg-[#374151] transition p-2 rounded-lg text-slate-300">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Player Section */}
        <div className="bg-[#111827] pb-4 rounded-b-xl border-t border-[#1F2937]">
          {/* Video Container */}
          <div 
            className="group relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
             {isLoading && (
               <div className="absolute inset-0 flex items-center justify-center flex-col z-10 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-300">Loading stream...</span>
               </div>
             )}
             
             {selectedChannel?.streamType === 'embed' ? (
               <div 
                 className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                 dangerouslySetInnerHTML={{ __html: selectedChannel.streamUrl }}
               />
             ) : (
               <>
                 <video 
                   ref={videoRef}
                   className="w-full h-full object-contain relative z-0"
                   playsInline
                   muted={isMuted}
                   onPlay={() => setIsPlaying(true)}
                   onPause={() => setIsPlaying(false)}
                   onClick={togglePlay}
                 />
                 
                 {/* Brightness Overlay Filter */}
                 <div 
                   className="absolute inset-0 pointer-events-none transition-opacity duration-75 z-10" 
                   style={{ backgroundColor: `rgba(0,0,0,${Math.max(0, 0.8 - brightness * 0.8)})` }} 
                 />

                 {/* Volume / Brightness Indicator Toast */}
                 {showOverlay && (
                   <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-2 z-50 transition-opacity whitespace-nowrap shadow-lg border border-white/10">
                     {showOverlay.type === 'brightness' ? <Sun className="w-4 h-4" /> : (showOverlay.value === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />)}
                     <span className="text-sm font-bold tracking-wide">{Math.round(showOverlay.value * 100)}%</span>
                   </div>
                 )}
                 
                 {/* Big play button overlay when paused */}
                 {!isPlaying && !isLoading && (
                   <button 
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-all z-20"
                   >
                     <div className="w-16 h-16 bg-blue-600/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transform group-hover:scale-105 transition-transform">
                       <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                     </div>
                   </button>
                 )}
               </>
             )}
          </div>
        </div>
        </div>
        
        {/* Scrollable Controls Section */}
        <div className="bg-[#111827] pb-4 rounded-b-xl border-t-0">
          <div className="px-3 pt-3 relative z-10">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-white font-medium flex items-center gap-2 text-sm">
                Now Playing <span className="text-slate-400 text-xs font-normal">• {selectedChannel?.name || 'Loading...'}</span>
              </h2>
              <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 text-red-500 text-[10px] font-bold">
                 <Users className="w-3 h-3" />
                 {viewerCount.toLocaleString()} Watching
              </div>
            </div>

            {/* Quality Selector */}
            <div className="relative mb-2.5">
              <div 
                className="w-full bg-[#1F2E45] border border-[#2A3A5A] rounded-lg p-2.5 flex justify-between items-center cursor-pointer transition-colors hover:bg-[#2A3A5A]"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
              >
                <span className="text-xs font-medium text-white">{getQualityText(currentQuality)}</span>
                <ChevronDown className={clsx("w-3.5 h-3.5 text-slate-400 transition-transform", showQualityMenu && "rotate-180")} />
              </div>
              
              {showQualityMenu && qualities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1F2E45] border border-[#2A3A5A] rounded-lg shadow-xl z-30 overflow-hidden">
                  <div 
                    className={clsx(
                      "px-3 py-2 text-xs font-medium cursor-pointer transition-colors",
                      currentQuality === -1 ? "bg-blue-600/20 text-blue-400" : "text-white hover:bg-[#2A3A5A]"
                    )}
                    onClick={() => handleQualityChange(-1)}
                  >
                    Auto (Source)
                  </div>
                  {qualities.map((q) => (
                    <div 
                      key={q.level}
                      className={clsx(
                        "px-3 py-2 text-xs font-medium cursor-pointer transition-colors",
                        currentQuality === q.level ? "bg-blue-600/20 text-blue-400" : "text-white hover:bg-[#2A3A5A]"
                      )}
                      onClick={() => handleQualityChange(q.level)}
                    >
                      {q.height}p
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-2.5 mb-2.5">
              <button 
                onClick={togglePlay}
                className="bg-[#1F2E45] hover:bg-[#2A3A5A] border border-[#2A3A5A] rounded-lg py-2 flex items-center justify-center gap-1.5 transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />}
                <span className="text-[13px] font-medium text-white">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              
              <button 
                onClick={toggleSound}
                className="bg-[#1F2E45] hover:bg-[#2A3A5A] border border-[#2A3A5A] rounded-lg py-2 flex items-center justify-center gap-1.5 transition"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                <span className="text-[13px] font-medium text-white">Sound</span>
              </button>

              <button 
                onClick={toggleFullscreen}
                className="bg-[#1F2E45] hover:bg-[#2A3A5A] border border-[#2A3A5A] rounded-lg py-2 flex items-center justify-center gap-1.5 transition"
              >
                <Maximize className="w-3.5 h-3.5 text-white" />
                <span className="text-[13px] font-medium text-white">Full</span>
              </button>
            </div>

            <button 
              onClick={handleRefresh}
              className="w-full bg-[#1F2E45] hover:bg-[#2A3A5A] border border-[#2A3A5A] rounded-lg py-2.5 flex items-center justify-center gap-2 transition"
            >
              <RefreshCcw className="w-3.5 h-3.5 text-white" />
              <span className="text-[13px] font-medium text-white">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Fan Prediction Section */}
        {predictionData?.isSystemActive && predictionData.matchData && (
          <div className="mx-3 mt-4 bg-[#0B1527] rounded-r-xl border-l-[3px] border-[#3B82F6] overflow-hidden p-3 mb-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
               <div className="bg-[#142B4D] text-[#60A5FA] px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Next match
               </div>
               <div className={`text-[11px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                  countdown === 'LIVE' 
                    ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                    : 'text-slate-300 bg-[#111C31] border-[#1A2B4C] font-mono'
                }`}>
                  {countdown === 'LIVE' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  {countdown === 'LIVE' ? 'MATCH LIVE' : countdown}
               </div>
            </div>

            {/* Teams */}
            <div className="flex items-center gap-2 text-white font-bold text-[13px] mb-3 flex-wrap">
               <span className="flex items-center gap-1.5">
                 <img src={predictionData.matchData.teamA.flag || undefined} alt={predictionData.matchData.teamA.name} className="w-[18px] h-[13px] rounded-[2px] object-cover shadow-sm" loading="lazy" decoding="async" />
                 {predictionData.matchData.teamA.name}
               </span>
               <span className="text-slate-500 text-[9px] font-bold px-1 italic border border-slate-700/50 rounded bg-[#111C31] pt-0.5 pb-0.5 uppercase">vs</span>
               <span className="flex items-center gap-1.5 line-clamp-1 truncate flex-1">
                 <img src={predictionData.matchData.teamB.flag || undefined} alt={predictionData.matchData.teamB.name} className="w-[18px] h-[13px] rounded-[2px] object-cover shadow-sm" loading="lazy" decoding="async" />
                 <span className="truncate">{predictionData.matchData.teamB.name}</span>
               </span>
            </div>

            {/* Prediction Card */}
            <div className="bg-[#0D1A30] rounded-xl p-3.5 shadow-lg border border-[#142B4D]/40">
              {/* Inner Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                     <LineChart className="w-4 h-4 flex-shrink-0" /> Fan Prediction
                  </h3>
                  <p className="text-slate-300 text-[14px] mt-1 font-medium">{predictionData.matchData.question}</p>
                </div>
                <div className="bg-[#142B4D] text-[#93C5FD] font-bold text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ml-2">
                   {formatVotes(totalVotes)} votes
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 mb-4">
                 <button 
                   onClick={() => handleVote('teamA')}
                   className={clsx(
                     "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-white text-[13px] font-semibold shadow-sm transition-all relative overflow-hidden",
                     userVote === 'teamA' ? "bg-emerald-500/10 border-emerald-500" : "border-transparent bg-[#11203A] hover:bg-[#16294A]"
                   )}
                 >
                    <div className={clsx("w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 transition-colors z-10", 
                        userVote === 'teamA' ? "bg-emerald-500 border-emerald-500" : "border-2 border-slate-500 bg-[#0B1527]"
                    )}>
                       {userVote === 'teamA' && <Check className="w-2.5 h-2.5 text-white stroke-[3]"/>}
                    </div>
                    <img src={predictionData.matchData.teamA.flag || undefined} alt={predictionData.matchData.teamA.name} className="w-[18px] h-[13px] rounded-[2px] object-cover shadow-sm z-10" loading="lazy" decoding="async" />
                    <span className="z-10">{predictionData.matchData.teamA.name}</span>
                 </button>

                 {predictionData.matchData.hasDrawOption && (
                   <button 
                     onClick={() => handleVote('draw')}
                     className={clsx(
                       "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-white text-[13px] font-semibold shadow-sm transition-all relative overflow-hidden",
                       userVote === 'draw' ? "bg-emerald-500/10 border-emerald-500" : "border-transparent bg-[#11203A] hover:bg-[#16294A]"
                     )}
                   >
                      <div className={clsx("w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 transition-colors z-10", 
                          userVote === 'draw' ? "bg-emerald-500 border-emerald-500" : "border-2 border-slate-500 bg-[#0B1527]"
                      )}>
                         {userVote === 'draw' && <Check className="w-2.5 h-2.5 text-white stroke-[3]"/>}
                      </div>
                      <Handshake className="w-4 h-4 text-slate-300 z-10" />
                      <span className="z-10">Draw</span>
                   </button>
                 )}

                 <button 
                   onClick={() => handleVote('teamB')}
                   className={clsx(
                     "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-white text-[13px] font-semibold shadow-sm transition-all relative overflow-hidden",
                     userVote === 'teamB' ? "bg-emerald-500/10 border-emerald-500" : "border-transparent bg-[#11203A] hover:bg-[#16294A]"
                   )}
                 >
                    <div className={clsx("w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 transition-colors z-10", 
                        userVote === 'teamB' ? "bg-emerald-500 border-emerald-500" : "border-2 border-slate-500 bg-[#0B1527]"
                    )}>
                       {userVote === 'teamB' && <Check className="w-2.5 h-2.5 text-white stroke-[3]"/>}
                    </div>
                    <img src={predictionData.matchData.teamB.flag || undefined} alt={predictionData.matchData.teamB.name} className="w-[18px] h-[13px] rounded-[2px] object-cover shadow-sm z-10" loading="lazy" decoding="async" />
                    <span className="z-10 truncate">{predictionData.matchData.teamB.name}</span>
                 </button>
              </div>

              {/* Stats */}
              {userVote && (
                 <>
                   <div className="space-y-2.5 pt-3 border-t border-[#142B4D]/60 mt-3">
                     <div className="flex items-center gap-3 text-xs font-semibold text-white">
                        <div className="w-24 truncate">{predictionData.matchData.teamA.name}</div>
                        <div className="flex-1 h-[6px] bg-[#11203A] rounded-full overflow-hidden shrink-0 mt-0.5">
                           <div className="h-full bg-[#84cc16] rounded-full transition-all duration-1000" style={{ width: `${teamAPct}%` }}></div>
                        </div>
                        <div className="w-8 text-right text-[11px] font-bold">{teamAPct}%</div>
                     </div>

                     {predictionData.matchData.hasDrawOption && (
                       <div className="flex items-center gap-3 text-xs font-semibold text-white">
                          <div className="w-24 truncate">Draw</div>
                          <div className="flex-1 h-[6px] bg-[#11203A] rounded-full overflow-hidden shrink-0 mt-0.5">
                             <div className="h-full bg-[#0ea5e9] rounded-full transition-all duration-1000" style={{ width: `${drawPct}%` }}></div>
                          </div>
                          <div className="w-8 text-right text-[11px] font-bold">{drawPct}%</div>
                       </div>
                     )}

                     <div className="flex items-center gap-3 text-xs font-semibold text-white">
                        <div className="w-24 truncate">{predictionData.matchData.teamB.name}</div>
                        <div className="flex-1 h-[6px] bg-[#11203A] rounded-full overflow-hidden shrink-0 mt-0.5">
                           <div className="h-full bg-[#0ea5e9] rounded-full transition-all duration-1000" style={{ width: `${teamBPct}%` }}></div>
                        </div>
                        <div className="w-8 text-right text-[11px] font-bold">{teamBPct}%</div>
                     </div>
                   </div>

                   {/* Insight Footer */}
                   <div className="mt-4 bg-[#0B1527] p-2.5 rounded-lg flex items-start sm:items-center gap-2 text-[11px] font-medium text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5 sm:mt-0" />
                      <span className="leading-snug">
                        Already selected: <strong className="text-white">
                           {userVote === 'teamA' ? predictionData.matchData.teamA.name : userVote === 'teamB' ? predictionData.matchData.teamB.name : 'Draw'}
                        </strong>
                      </span>
                   </div>
                 </>
              )}

            </div>
          </div>
        )}
        
        {/* Channels Section */}
        <div className="p-3 flex-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[15px] font-bold text-white">Live Channels</h3>
            <span className="bg-[#1F2E45] text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-[#2A3A5A]">
              {channels.length} channels
            </span>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channel name..."
              className="w-full bg-[#0F172A] border border-[#1F2E45] text-white text-[13px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-9 p-2.5 placeholder-slate-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((channel) => (
              <div 
                 key={channel.id}
                 onClick={() => setSelectedChannel(channel)}
                 className={clsx(
                   "rounded-xl overflow-hidden border transition cursor-pointer group flex flex-col",
                   selectedChannel?.id === channel.id ? "bg-[#111C31] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "bg-[#111827] border-[#1A2B4C] hover:border-blue-500/50"
                 )}
              >
                <div className="h-24 bg-white flex items-center justify-center relative overflow-hidden group">
                  <img 
                    src={channel.logoUrl || undefined} 
                    alt={channel.name} 
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                       // Fallback if image fails
                       (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>';
                       (e.target as HTMLImageElement).className = "w-6 h-6 opacity-50";
                    }}
                  />
                  {selectedChannel?.id === channel.id && (
                     <div className="absolute top-2 right-2 bg-blue-600 rounded-full shadow-md w-5 h-5 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                     </div>
                  )}
                  {channel.isActive && selectedChannel?.id !== channel.id && (
                    <div className="absolute top-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5 border border-white/10 flex items-center gap-1 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live</span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-[#111C31] flex flex-col gap-3">
                  <p className="font-semibold text-white text-sm line-clamp-1">{channel.name}</p>
                  
                  <div className="flex items-center justify-between">
                     <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded-md font-bold border border-emerald-500/20 flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                       Live
                    </span>
                    <span className="bg-[#1F2E45] text-slate-300 text-[10px] px-2 py-1 rounded-md flex items-center gap-1.5 border border-[#2A3A5A]">
                      <Eye className="w-3 h-3" />
                      {channel.streamType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="mx-3 mt-2 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#38BDF8]" />
              FIFA 2026 Schedule
            </h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {matchSchedule.map(match => (
              <div 
                key={match.id} 
                className={clsx(
                  "border rounded-xl p-3 flex flex-col justify-between transition-colors relative overflow-hidden",
                  match.isFinal ? "bg-[#1C1811] border-amber-500/40 hover:border-amber-400" : "bg-[#111C31] border-[#1A2B4C] hover:border-blue-500/50"
                )}
              >
                {match.isFinal && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                )}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium mb-3 relative z-10">
                  <div className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded border",
                    match.isFinal ? "bg-[#291A09] border-amber-900/50 text-amber-200/80" : "bg-[#0B1527] border-[#142B4D]"
                  )}>
                    <Clock className={clsx("w-3 h-3", match.isFinal ? "text-amber-400" : "text-[#38BDF8]")} /> 
                    {new Date(match.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <span className={clsx(
                    "px-2 py-1 rounded border flex items-center gap-1.5",
                    match.isFinal ? "bg-[#291A09] border-amber-900/50 text-amber-300 font-bold" : "bg-[#0B1527] border-[#142B4D]"
                  )}>
                    {match.isFinal && <Trophy className="w-3 h-3 text-amber-500 inline-block" />}
                    {match.group}{match.venue && ` • ${match.venue}`}
                  </span>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2.5 flex-1 max-w-[40%]">
                    {match.isFinal && match.teamA.code === "xx" ? (
                       <div className="w-7 h-[18px] bg-slate-800 rounded-[2px] flex items-center justify-center font-bold text-[8px] text-slate-500 border border-slate-700/50 shadow-sm">?</div>
                    ) : (
                       <img src={`https://flagcdn.com/${match.teamA.code}.svg`} alt={match.teamA.name} className="w-7 h-[18px] rounded-[2px] object-cover shadow-sm" loading="lazy" decoding="async" />
                    )}
                     <span className={clsx("text-sm font-bold truncate", match.isFinal ? "text-amber-50" : "text-white")}>{match.teamA.name}</span>
                  </div>
                  <div className={clsx(
                    "text-[10px] font-black italic px-1.5 py-0.5 rounded border uppercase",
                    match.isFinal ? "text-amber-500/70 bg-[#291A09] border-amber-900/50" : "text-slate-500 bg-[#0B1527] border-[#142B4D]"
                  )}>VS</div>
                  <div className="flex items-center gap-2.5 flex-1 max-w-[40%] justify-end">
                     <span className={clsx("text-sm font-bold truncate text-right", match.isFinal ? "text-amber-50" : "text-white")}>{match.teamB.name}</span>
                     {match.isFinal && match.teamB.code === "xx" ? (
                       <div className="w-7 h-[18px] bg-slate-800 rounded-[2px] flex items-center justify-center font-bold text-[8px] text-slate-500 border border-slate-700/50 shadow-sm">?</div>
                    ) : (
                       <img src={`https://flagcdn.com/${match.teamB.code}.svg`} alt={match.teamB.name} className="w-7 h-[18px] rounded-[2px] object-cover shadow-sm" loading="lazy" decoding="async" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

