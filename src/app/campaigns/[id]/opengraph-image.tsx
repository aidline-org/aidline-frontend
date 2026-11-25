import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import { KIND, STATUS_LABEL } from '@/components/campaign/kind';
import { getCampaign } from '@/lib/campaignData';
import { formatAmount, percent } from '@/lib/format';
import { safe } from '@/lib/safe';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Aidline campaign preview with title, location and funding figures';

const COLORS = {
  emergency: { signal: '#C4471D', wash: '#F6DED2' },
  climate: { signal: '#1F5C3F', wash: '#DCE8DF' },
};

function amount(raw: string | null | undefined): bigint {
  try {
    return BigInt(raw || '0');
  } catch {
    return 0n;
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontFamily: 'sans-serif',
          fontSize: 13,
          letterSpacing: 1.1,
          color: '#7A7468',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          marginTop: 6,
          fontFamily: 'monospace',
          fontSize: 20,
          color: '#1B1A17',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const campaign = await safe(() => getCampaign(id));
  const metadata = campaign?.metadata;
  const kind = campaign?.kind ?? 'emergency';
  const palette = COLORS[kind];
  const title = metadata?.title?.trim() || `Campaign #${id}`;
  const displayTitle = title.length > 96 ? `${title.slice(0, 93)}…` : title;
  const titleSize = displayTitle.length > 60 ? 54 : displayTitle.length > 36 ? 64 : 72;
  const [place, ...region] = (metadata?.location?.trim() || 'Location to be confirmed').split(',');
  const goal = amount(campaign?.goal);
  const raised = amount(campaign?.raised);
  const released = amount(campaign?.released);
  const refunded = amount(campaign?.refunded ?? '0');
  const escrow = raised - released - refunded > 0n ? raised - released - refunded : 0n;
  const needed = goal - raised > 0n ? goal - raised : 0n;
  const releasedPct = Math.max(0, Math.min(100, percent(released, goal)));
  const rawEscrowPct = Math.max(0, Math.min(100, percent(escrow, goal)));
  const totalPct = releasedPct + rawEscrowPct;
  const scale = totalPct > 100 ? 100 / totalPct : 1;
  const escrowPct = rawEscrowPct * scale;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: 56,
        background: '#F6F1E7',
        color: '#4A463F',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'serif', fontSize: 32, color: '#1B1A17' }}>Aidline</span>
        <span style={{ fontSize: 15, letterSpacing: 1.6, color: '#7A7468' }}>CAMPAIGN PREVIEW</span>
      </div>
      <div style={{ height: 1, marginTop: 24, background: '#D9CFBD' }} />

      <div style={{ display: 'flex', position: 'relative', flex: 1, marginTop: 48 }}>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            right: 420,
            top: 16,
            width: 220,
            opacity: 0.16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                style={{ height: 1, marginBottom: 24, width: '100%', background: palette.signal }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 694,
            paddingRight: 48,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
            <span style={{ color: palette.signal }}>{KIND[kind].label}</span>
            <span style={{ margin: '0 10px', color: '#D9CFBD' }}>/</span>
            <span style={{ color: '#7A7468' }}>
              {campaign ? STATUS_LABEL[campaign.status] : 'Open'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              maxHeight: titleSize * 1.08 * 3,
              overflow: 'hidden',
              fontFamily: 'serif',
              fontSize: titleSize,
              lineHeight: titleSize * 1.08,
              letterSpacing: -0.5,
              color: '#1B1A17',
            }}
          >
            {displayTitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 32 }}>
            <span style={{ fontFamily: 'serif', fontSize: 42, color: '#1B1A17' }}>{place}</span>
            {region.length > 0 && (
              <span style={{ marginLeft: 16, fontSize: 20, color: '#4A463F' }}>
                {region.join(',').trim()}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 338,
            padding: 28,
            border: '1px solid #D9CFBD',
            borderRadius: 2,
            background: palette.wash,
          }}
        >
          <span
            style={{
              fontSize: 13,
              letterSpacing: 1.1,
              color: '#4A463F',
              textTransform: 'uppercase',
            }}
          >
            Funding
          </span>
          <span
            style={{
              marginTop: 18,
              fontFamily: 'monospace',
              fontSize: 38,
              color: '#1B1A17',
            }}
          >
            {formatAmount(raised)}
          </span>
          <span style={{ display: 'flex', marginTop: 6, fontSize: 18, color: '#4A463F' }}>
            of {formatAmount(goal)} goal
          </span>
          <div style={{ height: 1, marginTop: 28, background: '#D9CFBD' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 24,
            }}
          >
            <Metric label="Released" value={formatAmount(released)} />
            <Metric label="In escrow" value={formatAmount(escrow)} />
          </div>
          <div style={{ display: 'flex', marginTop: 24 }}>
            <Metric label="Still needed" value={formatAmount(needed)} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 'auto',
          paddingTop: 24,
          borderTop: '1px solid #D9CFBD',
        }}
      >
        <div
          style={{
            display: 'flex',
            height: 18,
            overflow: 'hidden',
            border: '1px solid #D9CFBD',
            borderRadius: 2,
            background: '#FBF8F1',
          }}
        >
          <div style={{ display: 'flex', width: `${releasedPct}%`, background: palette.signal }} />
          <div
            style={{
              display: 'flex',
              width: `${escrowPct}%`,
              borderLeft: `1px solid ${palette.signal}`,
              backgroundImage: `repeating-linear-gradient(-45deg, ${palette.signal} 0, ${palette.signal} 2px, transparent 2px, transparent 7px)`,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 12,
            fontFamily: 'monospace',
            fontSize: 18,
            color: '#4A463F',
          }}
        >
          <span style={{ display: 'flex' }}>{formatAmount(released)} released</span>
          <span style={{ display: 'flex' }}>{formatAmount(escrow)} in escrow</span>
          <span style={{ display: 'flex' }}>{formatAmount(needed)} still needed</span>
        </div>
      </div>
    </div>,
    size,
  );
}
