import { Package } from 'lucide-react';

const PremiumLoader = () => (
  <>
    <style>{`
      @keyframes dl-spin-cw {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes dl-spin-ccw {
        from { transform: rotate(360deg); }
        to   { transform: rotate(0deg); }
      }
      @keyframes dl-pulse-glow {
        0%, 100% { opacity: 0.25; transform: scale(1); }
        50%       { opacity: 0.65; transform: scale(1.12); }
      }
      @keyframes dl-float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-9px); }
      }
      @keyframes dl-shimmer {
        0%   { background-position: -300% center; }
        100% { background-position:  300% center; }
      }
      @keyframes dl-char-in {
        from { opacity: 0; transform: translateY(14px); filter: blur(4px); }
        to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
      }
      @keyframes dl-dot-wave {
        0%, 80%, 100% { transform: scaleY(0.4); opacity: 0.3; }
        40%            { transform: scaleY(1.2); opacity: 1; }
      }
      @keyframes dl-orbit-a {
        from { transform: rotate(0deg)   translateX(54px) rotate(0deg); }
        to   { transform: rotate(360deg) translateX(54px) rotate(-360deg); }
      }
      @keyframes dl-orbit-b {
        from { transform: rotate(180deg)  translateX(38px) rotate(-180deg); }
        to   { transform: rotate(540deg)  translateX(38px) rotate(-540deg); }
      }
      @keyframes dl-orbit-c {
        from { transform: rotate(60deg)   translateX(68px) rotate(-60deg); }
        to   { transform: rotate(420deg)  translateX(68px) rotate(-420deg); }
      }
      @keyframes dl-bg-breathe {
        0%, 100% { opacity: 0.06; }
        50%       { opacity: 0.14; }
      }
    `}</style>

    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#090714',
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none',
    }}>

      {/* ── ambient background blobs ── */}
      <div style={{
        position: 'absolute', width: '420px', height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #A388E1 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'dl-bg-breathe 4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '200px', height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #FFE28A 0%, transparent 70%)',
        top: '42%', left: '54%',
        transform: 'translate(-50%, -50%)',
        animation: 'dl-bg-breathe 5s ease-in-out 1.5s infinite',
        opacity: 0.07,
        pointerEvents: 'none',
      }} />

      {/* ── orbital system ── */}
      <div style={{
        position: 'relative',
        width: '160px', height: '160px',
        marginBottom: '36px',
        animation: 'dl-float 3.6s ease-in-out infinite',
      }}>

        {/* ring 1 — outer CW */}
        <div style={{
          position: 'absolute', inset: '0',
          border: '1.5px solid transparent',
          borderTopColor: '#A388E1',
          borderRightColor: 'rgba(163,136,225,0.25)',
          borderBottomColor: 'transparent',
          borderLeftColor: 'rgba(255,226,138,0.45)',
          borderRadius: '50%',
          animation: 'dl-spin-cw 2.8s linear infinite',
        }} />

        {/* ring 2 — mid CCW */}
        <div style={{
          position: 'absolute', inset: '16px',
          border: '1px solid transparent',
          borderTopColor: 'rgba(255,226,138,0.55)',
          borderRightColor: 'transparent',
          borderBottomColor: 'rgba(163,136,225,0.3)',
          borderLeftColor: 'transparent',
          borderRadius: '50%',
          animation: 'dl-spin-ccw 2s linear infinite',
        }} />

        {/* ring 3 — inner CW slow */}
        <div style={{
          position: 'absolute', inset: '30px',
          border: '0.5px solid rgba(163,136,225,0.18)',
          borderTopColor: 'rgba(163,136,225,0.6)',
          borderRadius: '50%',
          animation: 'dl-spin-cw 4.5s linear infinite',
        }} />

        {/* orbit particle A — gold */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 0, height: 0,
          animation: 'dl-orbit-a 2.8s linear infinite',
        }}>
          <div style={{
            width: '7px', height: '7px',
            borderRadius: '50%',
            background: '#FFE28A',
            boxShadow: '0 0 10px 3px rgba(255,226,138,0.55)',
            marginTop: '-3.5px', marginLeft: '-3.5px',
          }} />
        </div>

        {/* orbit particle B — purple */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 0, height: 0,
          animation: 'dl-orbit-b 2s linear infinite',
        }}>
          <div style={{
            width: '5px', height: '5px',
            borderRadius: '50%',
            background: '#C4AEFF',
            boxShadow: '0 0 8px 3px rgba(196,174,255,0.55)',
            marginTop: '-2.5px', marginLeft: '-2.5px',
          }} />
        </div>

        {/* orbit particle C — outer gold trail */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 0, height: 0,
          animation: 'dl-orbit-c 4s linear infinite',
        }}>
          <div style={{
            width: '4px', height: '4px',
            borderRadius: '50%',
            background: 'rgba(255,226,138,0.6)',
            boxShadow: '0 0 6px 2px rgba(255,226,138,0.35)',
            marginTop: '-2px', marginLeft: '-2px',
          }} />
        </div>

        {/* centre icon disc */}
        <div style={{
          position: 'absolute', inset: '38px',
          background: 'linear-gradient(135deg, rgba(163,136,225,0.18) 0%, rgba(255,226,138,0.06) 100%)',
          border: '1px solid rgba(163,136,225,0.35)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 28px rgba(163,136,225,0.2), inset 0 0 18px rgba(163,136,225,0.07)',
          animation: 'dl-pulse-glow 2.4s ease-in-out infinite',
        }}>
          <Package
            style={{ width: '26px', height: '26px', color: '#A388E1' }}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* ── brand wordmark ── */}
      <div style={{
        display: 'flex',
        gap: '3px',
        marginBottom: '18px',
        letterSpacing: '0.18em',
      }}>
        {'DEALIT'.split('').map((ch, i) => (
          <span
            key={ch + i}
            style={{
              fontSize: '26px',
              fontWeight: '800',
              background: i < 2
                ? 'linear-gradient(135deg, #A388E1, #c4aeff)'
                : i < 4
                  ? 'linear-gradient(135deg, #c4aeff, #FFE28A)'
                  : 'linear-gradient(135deg, #FFE28A, #A388E1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: `dl-char-in 0.5s cubic-bezier(0.22,1,0.36,1) ${0.08 * i}s both`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* ── wave loading bars ── */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '22px' }}>
        {[0, 0.12, 0.24, 0.36, 0.48].map((delay, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: '18px',
              borderRadius: '2px',
              background: i < 3
                ? 'rgba(163,136,225,0.8)'
                : 'rgba(255,226,138,0.7)',
              animation: `dl-dot-wave 1s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  </>
);

export default PremiumLoader;