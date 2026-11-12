/**
 * Existing take-a-pic vision demo, lazy-loaded so it stays off the first paint.
 * Honest locked copy when vision is unavailable — MerchantItemFields already handles that.
 */
import React, { Suspense, lazy, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ItemPatch } from '../MerchantItemFields';

const MerchantItemFields = lazy(() =>
  import('../MerchantItemFields').then((m) => ({ default: m.MerchantItemFields })),
);

const emptyItem = () => ({
  name: '',
  price: '',
  qty: '',
  sku: '',
  variant: '',
  description: '',
  image: '',
  tags: [] as string[],
});

export const VisionDemo: React.FC = () => {
  const [item, setItem] = useState(emptyItem);

  const onChange = (patch: ItemPatch) => {
    setItem((prev) => ({
      ...prev,
      ...patch,
      name: patch.name ?? prev.name,
      price: patch.price ?? prev.price,
      qty: patch.qty ?? prev.qty,
      sku: patch.sku ?? prev.sku,
      variant: patch.variant ?? prev.variant,
      description: patch.description ?? prev.description,
      image: patch.image ?? prev.image,
      tags: patch.tags ?? prev.tags,
    }));
  };

  return (
    <section id="try-a-photo" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0d9488]">Photo to listing</p>
          <h2 className="text-3xl font-black tracking-tight text-[#141414] sm:text-4xl">
            Snap a photo. Confirm the name. Type the TT$.
          </h2>
          <p className="mt-4 text-lg text-[#4a453d]">
            Same camera as create-store. Vision can draft a name and description from the photo. You confirm or edit, then you
            type the TT$ price. Vision never sets the price. Nothing is saved on this page.
          </p>
          <p className="mt-2 text-sm text-[#5c574e]">
            No photo means no draft. If vision is locked, type the name and price yourself — we do not invent a listing.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#e8dcc8] bg-[#faf7f2] px-5 py-12 text-center text-sm text-[#5c574e]">
              Loading the photo tool…
            </div>
          }
        >
          <MerchantItemFields
            presentation="landing"
            name={item.name}
            price={item.price}
            qty={item.qty}
            sku={item.sku}
            variant={item.variant}
            description={item.description}
            image={item.image}
            tags={item.tags}
            onChange={onChange}
          />
        </Suspense>
        <p className="mt-8 rounded-2xl border border-[#e8dcc8] bg-[#faf7f2] px-5 py-4 text-center text-sm text-[#5c574e]">
          Nothing is saved on this page. Continue to create store to keep this listing draft.
        </p>
        <div className="mt-5 text-center">
          <Link
            to="/create-store"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#ce1126] px-7 py-3.5 font-bold text-white hover:bg-[#b50f21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1f24]"
          >
            Continue to create store
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VisionDemo;
