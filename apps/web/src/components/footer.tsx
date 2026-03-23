import { Link } from '@tanstack/react-router';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const footerSections = [
  {
    title: 'Kurumsal',
    links: [
      // { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'İletişim', href: '/iletisim' },
      // { label: 'Mağazalar', href: '/magazalar' },
      // { label: 'Kariyer', href: '/kariyer' },
    ],
  },
  {
    title: 'Müşteri Hizmetleri',
    links: [
      { label: 'Sipariş Takip', href: '/siparis-takip' },
      { label: 'İptal İade Koşulları', href: '/legal' },
      // { label: 'Kargo Bilgileri', href: '/kargo' },
      // { label: 'Sıkça Sorulan Sorular', href: '/sss' },
    ],
  },
  {
    title: 'Alışveriş',
    links: [
      { label: 'Gizlilik ve Güvenlik', href: '/legal#gizlilik' },
      // { label: 'Kullanım Koşulları', href: '/legal#kosullar' },
      // { label: 'Çerez Politikası', href: '/legal#cerez' },
      { label: 'KVKK', href: '/legal#kvkk' },
    ],
  },
  {
    title: 'Kategoriler',
    links: [
      { label: 'Abaya Takımı', href: '/urunler?d=Abaya+Takımı' },
      { label: 'Ferace', href: '/urunler?d=Ferace' },
      { label: 'Kış Sezonu', href: '/urunler?d=Kış+Sezonu' },
      { label: 'Şal ve Eşarp', href: '/urunler?d=Şal+ve+Eşarp' },
      { label: 'Tesettür Elbise', href: '/urunler?d=Tesettür+Elbise' },
      { label: 'Yeni Ürünler', href: '/urunler?d=Yeni+Ürünler' },
    ],
  },
];

const contactInfo = [
  { icon: Phone, text: '+90 (532) 379 3706', href: 'tel:+905323793706' },
  { icon: MapPin, text: 'Ankara, Türkiye', href: '#' },
];

const socialLinks = [
  // { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/yagmur_feracem', label: 'Instagram' },
  // { icon: Twitter, href: '#', label: 'Twitter' },
];

function FooterSection({ title, links }: { title: string, links: { label: string, href: string }[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
        {title}
      </h3>
      <nav className="flex flex-col space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function ContactSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
        İletişim
      </h3>
      <div className="space-y-3">
        {contactInfo.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={index}
              href={item.href}
              className="flex items-center space-x-3 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.text}</span>
            </a>
          );
        })}
      </div>

      <div className="pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Bizi Takip Edin</h4>
        <div className="flex space-x-3">
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <a
                key={index}
                href={social.href}
                aria-label={social.label}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                <Icon className="h-4 w-4 text-gray-600" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NewsletterSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
        Bülten
      </h3>
      <p className="text-sm text-gray-600">
        Yeni ürünler ve kampanyalardan haberdar olmak için e-posta listemize katılın.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="E-posta adresiniz"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors duration-200">
          Abone Ol
        </button>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Logo and newsletter - takes 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <Link to="/" className="text-2xl font-bold text-gray-900">
                  Yağmur Feracem
                </Link>
              </div>
              <ContactSection />
              {/* <NewsletterSection /> */}
            </div>

            {/* Footer sections */}
            {footerSections.map((section) => (
              <FooterSection
                key={section.title}
                title={section.title}
                links={section.links}
              />
            ))}

            {/* Contact section */}
            {/* <div className="lg:col-span-1">
              <ContactSection />
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}