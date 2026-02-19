import { ImageResponse } from 'next/og';
import { getProfileData } from '@/lib/supabase/queries';

// Note: Not using edge runtime because getProfileData() requires cookies() from next/headers
export const alt = 'Lalding — Full-stack Tech Lead Portfolio';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const profile = await getProfileData();

  const name = profile?.fullName ?? 'Laldingliana Tlau Vantawl';
  const title = profile?.jobTitle ?? 'Full-stack Tech Lead';
  const tagline = profile?.tagline ?? '15+ years of experience building scalable web applications';

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage:
          'radial-gradient(circle at 25px 25px, rgba(148, 163, 184, 0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(148, 163, 184, 0.1) 2%, transparent 0%)',
        backgroundSize: '100px 100px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          maxWidth: '1000px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            background: 'linear-gradient(to bottom right, #60a5fa, #a78bfa)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 48,
            color: '#e2e8f0',
            marginBottom: '30px',
            textAlign: 'center',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          {tagline}
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
