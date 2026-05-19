'use client';

type TacticalBackdropProps = {
  variant?: 'hero' | 'auth';
};

export default function TacticalBackdrop({ variant = 'hero' }: TacticalBackdropProps) {
  return (
    <div className={`tactical-backdrop tactical-backdrop-${variant}`} aria-hidden="true">
      <div className="tactical-grid" />
      <div className="tactical-haze" />
      <div className="tactical-beam tactical-beam-a" />
      <div className="tactical-beam tactical-beam-b" />
      <div className="tactical-radar">
        <div className="tactical-radar-core" />
      </div>
      <div className="tactical-shard tactical-shard-a" />
      <div className="tactical-shard tactical-shard-b" />
      <div className="tactical-shard tactical-shard-c" />
    </div>
  );
}
