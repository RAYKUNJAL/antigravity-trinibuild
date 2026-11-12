import React from 'react';
import { STORE_STARTERS, type StoreStarter } from '../../services/storeStarters';
import { heroSources, STARTER_HERO_RE } from '../../services/storeDesignTokens';
import { showSampleImageLabel, type StorefrontModel } from '../../services/storefrontHonesty';

function readHeroFile(file: File, onDone: (dataUrl: string) => void) {
  if (!file.type.startsWith('image/')) return;
  if (file.size > 2_500_000) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    onDone(canvas.toDataURL('image/jpeg', 0.82));
  };
  img.src = url;
}

export function resolveHeroSrc(model: StorefrontModel): string {
  if (model.hero?.image) return model.hero.image;
  if (model.mode === 'published') return '';
  return STORE_STARTERS[model.templateId].heroImage;
}

function sourcesFor(model: StorefrontModel, src: string): { src: string; srcSet?: string; sizes?: string } {
  if (!src) return { src: '' };
  if (!STARTER_HERO_RE.test(src) && !src.startsWith('/templates/heroes/')) {
    return { src };
  }
  const starter = STORE_STARTERS[model.templateId];
  const built = heroSources(model.templateId);
  return {
    src: starter.heroImage || built.src,
    srcSet: starter.heroSrcSet || built.srcSet,
    sizes: starter.heroSizes || built.sizes,
  };
}

export const SampleImageLabel: React.FC<{ model: StorefrontModel; src: string }> = ({ model, src }) => {
  if (model.mode === 'illustrative') return null;
  if (!showSampleImageLabel(model, src)) return null;
  if (!src) return null;
  const text = 'Starter image';
  return (
    <span
      style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        zIndex: 3,
        background: 'rgba(20,20,20,0.78)',
        color: '#fff8f0',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
        padding: '5px 9px',
        borderRadius: 4,
      }}
    >
      {text}
    </span>
  );
};

export const HeroMedia: React.FC<{
  model: StorefrontModel;
  starter: StoreStarter;
  src: string;
  editable?: boolean;
  onUpload?: (dataUrl: string) => void;
  priority?: boolean;
  fill?: boolean;
}> = ({ model, starter, src, editable, onUpload, priority, fill }) => {
  const sources = sourcesFor(model, src);
  return (
    <div
      style={{
        position: fill ? 'absolute' : 'relative',
        inset: fill ? 0 : undefined,
        minHeight: fill ? undefined : '100%',
        height: fill ? undefined : '100%',
        background: starter.palette.field,
        overflow: 'hidden',
      }}
    >
      {sources.src ? (
        <img
          loading={priority ? 'eager' : 'lazy'}
          src={sources.src}
          srcSet={sources.srcSet}
          sizes={sources.sizes || '100vw'}
          alt=""
          width={1600}
          height={900}
          decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : null}
      <SampleImageLabel model={model} src={src} />
      {editable && onUpload ? (
        <label
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 16,
            background: src ? 'transparent' : 'rgba(0,0,0,0.04)',
            zIndex: 4,
          }}
        >
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readHeroFile(file, onUpload);
            }}
          />
          <span
            style={{
              minHeight: 44,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(20,20,20,0.72)',
              color: '#FFF8F0',
              fontSize: 12,
              borderRadius: 8,
            }}
          >
            {src ? 'Replace photo' : 'Tap to add your photo'}
          </span>
        </label>
      ) : null}
    </div>
  );
};

export default HeroMedia;
