import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SPANISH_COUNTRIES = [
  'ES', 'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR', 'PY',
];

const LOCALE_COOKIE = 'velora-locale';
const MANUAL_COOKIE = 'velora-locale-manual';

interface Geo {
  country?: string;
  region?: string;
  city?: string;
}

function countryToLocale(country?: string): 'en' | 'es' {
  if (!country) return 'es';
  return SPANISH_COUNTRIES.includes(country) ? 'es' : 'en';
}

export function middleware(request: NextRequest) {
  const hasManualChoice = request.cookies.get(MANUAL_COOKIE)?.value === 'true';
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  if (hasManualChoice && (existingLocale === 'en' || existingLocale === 'es')) {
    return NextResponse.next();
  }

  // Vercel provides geo in request.geo on edge runtime
  const geo = (request as unknown as { geo?: Geo }).geo;
  const detectedLocale = countryToLocale(geo?.country);

  if (existingLocale !== detectedLocale) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, detectedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
