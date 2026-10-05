/** GSIC mark, served from public/favicon.png so the tab icon and the on-page logo are always the same file. */
export default function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/favicon.png" alt="" width={size} height={size} className={`shrink-0 rounded-lg object-contain ${className}`} style={{ width: size, height: size }} />
  );
}
