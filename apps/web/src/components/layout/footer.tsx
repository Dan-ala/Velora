import Link from 'next/link';

const FOOTER_LINKS = {
  Shop: [
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Shirts', href: '/products?category=shirts' },
    { label: 'Hoodies', href: '/products?category=hoodies' },
    { label: 'Shoes', href: '/products?category=shoes' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/careers' },
  ],
  Support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'Size Guide', href: '/size-guide' },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 tablet:px-6 wide:px-8">
        <div className="grid gap-12 tablet:grid-cols-2 desktop:grid-cols-5">
          <div className="desktop:col-span-1">
            <Link href="/" className="text-2xl font-display font-bold tracking-[0.3em]">
              VELORA
            </Link>
            <p className="mt-3 text-sm text-brand-stone">Wear your identity</p>
            <p className="mt-1 text-xs text-brand-stone/60">
              Premium clothing for the modern individual.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-stone transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-xs text-brand-stone/60">
          &copy; {new Date().getFullYear()} VELORA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
