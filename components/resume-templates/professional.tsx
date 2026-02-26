// This template uses inline styles intentionally — it is rendered to static HTML
// by Playwright for PDF generation, where the compiled Tailwind stylesheet is
// not available. Inline styles guarantee visual fidelity in the headless context.

import DOMPurify from 'isomorphic-dompurify';
import PageWrapper from './shared/page-wrapper';
import SectionHeading from './shared/section-heading';
import type {
  ResumeData,
  ResumeSection,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillGroupItem,
  CustomItem,
} from './types';

// ── Monogram Logo ──────────────────────────────────────────────────

function Monogram({ accentColor, fullName }: { accentColor: string; fullName: string }) {
  const nameParts = fullName.trim().split(/\s+/);
  const firstInitial = nameParts[0]?.[0]?.toUpperCase() ?? '';
  const lastInitial = nameParts.length > 1 ? nameParts[1][0].toUpperCase() : '';

  return (
    <div
      style={{
        width: '110px',
        height: '110px',
        border: `2px solid ${accentColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        lineHeight: '1.1',
        color: accentColor,
        position: 'relative',
      }}
    >
      <span style={{ position: 'relative', top: '-4px', left: '-15px' }}>{firstInitial}</span>
      {lastInitial && (
        <>
          <div
            style={{
              width: '80%',
              height: '1px',
              backgroundColor: accentColor,
              transform: 'rotate(-45deg)',
              position: 'absolute',
            }}
          />
          <span style={{ position: 'relative', top: '4px', left: '15px' }}>{lastInitial}</span>
        </>
      )}
    </div>
  );
}

// ── Contact Line ───────────────────────────────────────────────────

function ContactLine({ profile }: { profile: ResumeData['profile'] }) {
  const parts: string[] = [];

  parts.push(profile.email);
  if (profile.phone) parts.push(profile.phone);
  if (profile.location) parts.push(profile.location);

  const links: Array<{ label: string; url: string }> = [];
  if (profile.websiteUrl) links.push({ label: 'WWW', url: profile.websiteUrl });
  if (profile.linkedinUrl) links.push({ label: 'LinkedIn', url: profile.linkedinUrl });
  if (profile.githubUrl) links.push({ label: 'GitHub', url: profile.githubUrl });

  return (
    <div style={{ fontSize: '9.5pt', lineHeight: '1.6' }}>
      <div>{parts.join('  |  ')}</div>
      {links.map((link) => (
        <div key={link.label}>
          <strong>{link.label}:</strong>{' '}
          <a
            href={link.url}
            rel="noopener noreferrer"
            style={{ color: '#333', textDecoration: 'none' }}
          >
            {link.url}
          </a>
        </div>
      ))}
    </div>
  );
}

// ── Section Row (label left, content right) ────────────────────────

function SectionRow({
  label,
  accentColor,
  headingFontFamily,
  children,
}: {
  label: string;
  accentColor: string;
  headingFontFamily: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        marginTop: '16px',
      }}
    >
      <div style={{ width: '22%', flexShrink: 0, paddingTop: '2px' }}>
        <SectionHeading
          label={label}
          accentColor={accentColor}
          headingFontFamily={headingFontFamily}
        />
      </div>
      <div style={{ width: '78%' }}>{children}</div>
    </div>
  );
}

// ── Experience Entry ───────────────────────────────────────────────

function ExperienceEntry({ item }: { item: ExperienceItem }) {
  // Split description by newlines into bullet points
  const bullets = item.description
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <strong>{item.title}</strong>
          {'  |  '}
          <span>{item.company}</span>
        </div>
        <div style={{ fontSize: '9.5pt', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {item.displayDate}
        </div>
      </div>
      {bullets.length > 0 && (
        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
          {bullets.map((bullet, i) => (
            <li key={i} style={{ marginBottom: '2px' }}>
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Skills Section ─────────────────────────────────────────────────

function SkillsContent({ items }: { items: SkillGroupItem[] }) {
  return (
    <div>
      {items.map((group) => (
        <div key={group.category} style={{ marginBottom: '4px' }}>
          <strong>{group.category}:</strong> {group.skills.join(', ')}
        </div>
      ))}
    </div>
  );
}

// ── Project Entry ───────────────────────────────────────────────

function ProjectEntry({ item }: { item: ProjectItem }) {
  const urls = [item.liveSiteUrl, item.sourceCodeUrl].filter(Boolean) as string[];

  return (
    <div style={{ marginBottom: '12px' }}>
      <div>
        <strong>{item.title}</strong>
      </div>
      {urls.length > 0 && (
        <div style={{ fontSize: '9.5pt', marginTop: '1px' }}>
          {urls.map((url) => (
            <div key={url}>
              <a
                href={url}
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {url}
              </a>
            </div>
          ))}
        </div>
      )}
      <p style={{ margin: '2px 0 0 0' }}>{item.description}</p>
      {item.tags.length > 0 && (
        <p style={{ margin: '2px 0 0 0', fontSize: '9.5pt', color: '#555' }}>
          {item.tags.join(', ')}
        </p>
      )}
    </div>
  );
}

// ── Education Entry ──────────────────────────────────────────────

function EducationEntry({ item }: { item: EducationItem }) {
  const bullets = (item.description ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const subtitle = item.fieldOfStudy ? `${item.degree}, ${item.fieldOfStudy}` : item.degree;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <strong>{item.institution}</strong>
          {'  |  '}
          <span>{subtitle}</span>
        </div>
        {item.displayDate && (
          <div style={{ fontSize: '9.5pt', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {item.displayDate}
          </div>
        )}
      </div>
      {bullets.length > 0 && (
        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
          {bullets.map((bullet, i) => (
            <li key={i} style={{ marginBottom: '2px' }}>
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Custom Section ────────────────────────────────────────────────

function CustomContent({ items }: { items: CustomItem[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{ marginBottom: '8px' }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(item.content, {
              FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'meta'],
              FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
            }),
          }}
        />
      ))}
    </div>
  );
}

// ── Section Renderer ───────────────────────────────────────────────

function SectionContent({ section }: { section: ResumeSection }) {
  switch (section.type) {
    case 'experience':
      return (
        <>
          {(section.items as ExperienceItem[]).map((item, i) => (
            <ExperienceEntry key={i} item={item} />
          ))}
        </>
      );
    case 'projects':
      return (
        <>
          {(section.items as ProjectItem[]).map((item, i) => (
            <ProjectEntry key={i} item={item} />
          ))}
        </>
      );
    case 'skills':
      return <SkillsContent items={section.items as SkillGroupItem[]} />;
    case 'education':
      return (
        <>
          {(section.items as EducationItem[]).map((item, i) => (
            <EducationEntry key={i} item={item} />
          ))}
        </>
      );
    case 'custom':
      return <CustomContent items={section.items as CustomItem[]} />;
    default:
      return null;
  }
}

// ── Main Template ──────────────────────────────────────────────────

export default function ProfessionalTemplate({ data }: { data: ResumeData }) {
  const { profile, summary, sections, style } = data;

  return (
    <PageWrapper pageSize={data.pageSize} style={style}>
      {/* Header: Logo + Name + Contact — uses same column layout as SectionRow */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '16px',
        }}
      >
        {/* Left column — same 22% width as section labels */}
        <div
          style={{
            width: '22%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '4px',
          }}
        >
          <Monogram accentColor={style.accentColor} fullName={profile.fullName} />
        </div>
        {/* Right column — same 78% width as section content */}
        <div style={{ width: '78%' }}>
          <h1
            style={{
              fontFamily: style.headingFontFamily,
              fontSize: '32pt',
              fontWeight: 800,
              lineHeight: '1.05',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: style.primaryColor,
            }}
          >
            {(() => {
              const parts = profile.fullName.trim().split(/\s+/);
              const firstName = parts[0];
              const lastName = parts.slice(1).join(' ');
              return (
                <>
                  {firstName}
                  {lastName && (
                    <>
                      <br />
                      {lastName}
                    </>
                  )}
                </>
              );
            })()}
          </h1>
          {profile.jobTitle && (
            <div
              style={{
                fontFamily: style.headingFontFamily,
                fontSize: '13pt',
                fontWeight: 600,
                lineHeight: '1.3',
                color: style.accentColor,
                marginTop: '2px',
              }}
            >
              {profile.jobTitle}
            </div>
          )}
          <div style={{ marginTop: '8px' }}>
            <ContactLine profile={profile} />
          </div>
        </div>
      </div>

      {/* Separator */}
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid #e0e0e0',
          margin: '0 0 4px 0',
        }}
      />

      {/* Summary */}
      {summary && (
        <SectionRow
          label="Professional Summary"
          accentColor={style.accentColor}
          headingFontFamily={style.headingFontFamily}
        >
          <p style={{ margin: 0 }}>{summary}</p>
        </SectionRow>
      )}

      {/* Dynamic sections */}
      {sections.map((section, i) => (
        <SectionRow
          key={i}
          label={section.label}
          accentColor={style.accentColor}
          headingFontFamily={style.headingFontFamily}
        >
          <SectionContent section={section} />
        </SectionRow>
      ))}
    </PageWrapper>
  );
}
