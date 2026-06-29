const CLOUDINARY_REGEX = /res\.cloudinary\.com\/[^/]+\/image\/upload\//;

export function getOptimizedImageUrl(url: string, width?: number): string {
  if (!url || !CLOUDINARY_REGEX.test(url)) return url;

  const base = url.split('/upload/')[0] + '/upload/';
  const rest = url.split('/upload/')[1];

  let transforms = 'q_auto,f_auto';
  if (width) transforms += `,w_${width}`;

  const hasTransforms = /^[a-z_]+,/.test(rest);
  if (hasTransforms) {
    return base + transforms + '/' + rest.split('/').slice(1).join('/');
  }

  return base + transforms + '/' + rest;
}

export function getBlurUrl(url: string): string {
  if (!url || !CLOUDINARY_REGEX.test(url)) return url;

  const base = url.split('/upload/')[0] + '/upload/';
  const rest = url.split('/upload/')[1];

  const transforms = 'e_blur:1000,q_1,w_20';
  return base + transforms + '/' + rest;
}
