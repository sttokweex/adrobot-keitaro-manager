export function FormSectionHeading({
  step,
  title,
  description,
  className = "",
}: {
  step: number;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`form-section-title ${className}`.trim()}>
      <span>{step}</span>
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}
