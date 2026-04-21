import Link from "next/link"

export function Footer() {
  const links = [
    { href: "/", label: "Sustainability" },
    { href: "/", label: "Size Guide" },
    { href: "/", label: "Shipping & Returns" },
    { href: "/", label: "Privacy Policy" },
  ]

  return (
    <footer className="bg-stone-100 px-8 py-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col items-center">
          <h2 className="text-stone-600 text-3xl font-['Noto_Serif'] font-normal mb-8">
            SOVIA
          </h2>
          <div className="flex gap-12 mb-8">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-stone-400 text-lg hover:text-stone-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-stone-600 text-sm">
            © {new Date().getFullYear()} SOVIA Fashion. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}