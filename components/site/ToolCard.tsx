import Link from 'next/link';

export default function ToolCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="card block transition hover:border-gold hover:shadow-md">
      <p className="text-3xl" aria-hidden="true">
        {icon}
      </p>
      <h3 className="mt-2 font-display text-lg font-bold text-primary">{title}</h3>
      <p className="mt-1 text-sm text-ink/80">{desc}</p>
      <p className="mt-3 text-sm font-semibold text-primary">Tra cứu ngay →</p>
    </Link>
  );
}
