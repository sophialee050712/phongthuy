'use client';

// Ảnh minh họa của một trang tool, đọc từ bảng site_settings
// (key tool_illustration_<slug>, do ToolIllustrationPicker ở admin ghi).
// Không có ảnh thì không hiển thị gì — trang vẫn hoạt động bình thường.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/seo';

export default function ToolIllustration({
  toolSlug,
  alt,
}: {
  /** Slug của tool, vd "xem-ngay". */
  toolSlug: string;
  /** Alt text cho ảnh. */
  alt: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const key = `tool_illustration_${slugify(toolSlug)}`;
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (data && typeof data.value === 'string' && data.value) setUrl(data.value);
      });
  }, [toolSlug]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      className="w-full rounded-lg border border-gold/40 object-cover"
      loading="lazy"
    />
  );
}
