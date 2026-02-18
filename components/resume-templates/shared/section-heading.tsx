type SectionHeadingProps = {
  label: string;
  accentColor: string;
  headingFontFamily: string;
};

export default function SectionHeading({
  label,
  accentColor,
  headingFontFamily,
}: SectionHeadingProps) {
  return (
    <div
      style={{
        fontFamily: headingFontFamily,
        fontSize: '11pt',
        fontWeight: 700,
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        lineHeight: '1.3',
      }}
    >
      {label}
    </div>
  );
}
