import { useEffect, useState, type ReactNode } from 'react'
import CardFlip from './components/kokonutui/card-flip'
import almondImg from '../images/shapes/almond.png'
import coffinImg from '../images/shapes/coffin.png'
import flareImg from '../images/shapes/flare.png'
import ovalImg from '../images/shapes/oval.png'
import roundImg from '../images/shapes/round.png'
import squareImg from '../images/shapes/square.png'
import squovalImg from '../images/shapes/squoval.png'
import stilettoImg from '../images/shapes/stiletto.png'
import acrylicVideo from '../assets/media/acrylic.mp4'
import acrylicPoster from '../assets/media/posters/acrylic-poster.webp'
import builderGelVideo from '../assets/media/builder-gel.mp4'
import builderGelPoster from '../assets/media/posters/builder-gel-poster.webp'
import dipPowderVideo from '../assets/media/dip-powder.mp4'
import dipPowderPoster from '../assets/media/posters/dip-powder-poster.webp'
import fiberglassVideo from '../assets/media/fiberglass.mp4'
import fiberglassPoster from '../assets/media/posters/fiberglass-poster.webp'
import gelVideo from '../assets/media/gel.mp4'
import gelPoster from '../assets/media/posters/gel-poster.webp'
import pressOnVideo from '../assets/media/press-on.mp4'
import pressOnPoster from '../assets/media/posters/press-on-poster.webp'

type Page = 'home' | 'shapes' | 'nail-types' | 'faq'

type Navigate = (page: Page, anchor?: string) => void

interface Shape {
  slug: string
  name: string
  image: string
  durability: string
  durabilityNote: string
  length: string
  lengthNote: string
}

interface NailType {
  slug: string
  name: string
  description: string
  video: string
  poster: string
}

const SHAPES: Shape[] = [
  {
    slug: 'almond',
    name: 'Almond',
    image: almondImg,
    durability: 'Medium to high',
    durabilityNote:
      'The tapered apex keeps the structure strong, but the pointed tip can wear if you use your nails as tools.',
    length: 'Short to medium',
    lengthNote:
      'Best on 2–5 mm of free edge; longer tips weaken the taper quickly.',
  },
  {
    slug: 'oval',
    name: 'Oval',
    image: ovalImg,
    durability: 'High',
    durabilityNote:
      'Even curves distribute pressure across the nail, making chipping and snagging less likely.',
    length: 'Short to medium',
    lengthNote:
      'Works beautifully from 1–4 mm; keep it short for everyday strength.',
  },
  {
    slug: 'round',
    name: 'Round',
    image: roundImg,
    durability: 'Very high',
    durabilityNote:
      'The most resilient silhouette. There are no corners or points to catch, so breakage is minimal.',
    length: 'Short',
    lengthNote:
      'Ideal at 0–3 mm; a low-maintenance choice for active hands.',
  },
  {
    slug: 'square',
    name: 'Square',
    image: squareImg,
    durability: 'Medium',
    durabilityNote:
      'Straight sides are strong, but the four corners are the first place to chip or snag.',
    length: 'Short to medium',
    lengthNote:
      'Best at 2–5 mm; longer square tips need extra reinforcement.',
  },
  {
    slug: 'squoval',
    name: 'Squoval',
    image: squovalImg,
    durability: 'High',
    durabilityNote:
      'Square strength with softened corners, so the tip resists chipping better than a classic square.',
    length: 'Short to medium',
    lengthNote:
      'Flatters most nail beds at 2–5 mm; a balanced everyday length.',
  },
  {
    slug: 'coffin',
    name: 'Coffin',
    image: coffinImg,
    durability: 'Medium',
    durabilityNote:
      'The tapered sides look bold, but the narrowed structure is more fragile at longer lengths.',
    length: 'Medium to long',
    lengthNote:
      'Designed for 5–8 mm; shorter coffin shapes can look unbalanced.',
  },
  {
    slug: 'stiletto',
    name: 'Stiletto',
    image: stilettoImg,
    durability: 'Low to medium',
    durabilityNote:
      'The sharp point is the most delicate tip, so it needs careful wear and regular maintenance.',
    length: 'Long',
    lengthNote:
      'Best at 7–12 mm; short stilettos lose their signature line.',
  },
  {
    slug: 'flare',
    name: 'Flare',
    image: flareImg,
    durability: 'Medium',
    durabilityNote:
      'A wider bearing surface adds stability, though the flared corners can catch on fabric.',
    length: 'Medium to long',
    lengthNote:
      'Shines at 4–8 mm; keep the flare proportional to your nail bed.',
  },
]

const NAIL_TYPES: NailType[] = [
  {
    slug: 'gel',
    name: 'Gel',
    description:
      'A glossy, flexible finish cured under UV or LED light. It bonds to the natural nail for a lightweight, natural feel and typically wears for two to three weeks. Best for clients who want a clean, high-shine look without added length.',
    video: gelVideo,
    poster: gelPoster,
  },
  {
    slug: 'acrylic',
    name: 'Acrylic',
    description:
      'A liquid-and-powder system sculpted over the natural nail or tips. It sets strong and is ideal for custom length, dramatic shapes, and intricate art. Acrylic offers excellent durability but needs regular fills as the nail grows.',
    video: acrylicVideo,
    poster: acrylicPoster,
  },
  {
    slug: 'builder-gel',
    name: 'Builder Gel',
    description:
      'A thicker gel overlay that adds strength and structure without the weight of extensions. It is brushed on and cured, creating a smooth apex that supports the natural nail. Great for growing out weak or bitten nails.',
    video: builderGelVideo,
    poster: builderGelPoster,
  },
  {
    slug: 'dip-powder',
    name: 'Dip Powder',
    description:
      'A resin-and-powder layering technique that builds durable colour without UV curing. The finish is lightweight and chip-resistant, with a smooth, opaque look. Best suited to clients who prefer a quicker service and long-lasting wear.',
    video: dipPowderVideo,
    poster: dipPowderPoster,
  },
  {
    slug: 'fiberglass',
    name: 'Fibreglass',
    description:
      'Fine fibreglass mesh is bonded to the nail with resin for flexible reinforcement. It adds strength while keeping the result thin and natural-looking. Ideal for repairing splits or reinforcing fragile nails.',
    video: fiberglassVideo,
    poster: fiberglassPoster,
  },
  {
    slug: 'press-on',
    name: 'Press-on',
    description:
      'Pre-sculpted, reusable sets sized and finished for instant salon-level wear at home. Apply them with adhesive tabs for a temporary look or nail glue for longer wear. A practical option for events, travel, or between salon visits.',
    video: pressOnVideo,
    poster: pressOnPoster,
  },
]

const SERVICES = [
  {
    icon: '✦',
    title: 'Bespoke Nail Art',
    text: 'Fully hand-painted, one-of-a-kind designs. From minimalist line work to maximalist floral scenes — we paint your personality.',
  },
  {
    icon: '◈',
    title: 'Gel & Builder Extensions',
    text: 'Durable, flawless extensions sculpted in gel or acrylic. Long-lasting wear with a naturally luminous finish that feels effortless.',
  },
  {
    icon: '❋',
    title: 'Nail Spa & Restoration',
    text: 'Revive damaged nails with our signature treatment — a ritual combining deep nourishment, shaping, and a fresh, polished look.',
  },
  {
    icon: '⬡',
    title: 'Press-On Collections',
    text: 'Custom-made, wear-at-home press-ons crafted in-studio. Each set is hand-painted and sized to your exact nail measurements.',
  },
  {
    icon: '✿',
    title: 'Bridal & Event Packages',
    text: 'Tailored group packages for your most memorable occasions. We handle everything from trial sessions to on-the-day application.',
  },
  {
    icon: '◉',
    title: 'Nail Shape Consultation',
    text: 'Not sure which shape suits your hand? Our specialist guides you through options — from almond to coffin — finding your perfect silhouette.',
  },
]

const TESTIMONIALS = [
  {
    text: '"Aura Atelier completely changed how I see nail art. The attention to detail is unreal — I have never had so many compliments on a single set."',
    name: 'Priya S.',
    detail: 'Bridal package client',
  },
  {
    text: '"The studio atmosphere is pure luxury. From the moment I walked in to the last stroke of polish, I felt like a queen. My coffin set lasted six weeks flawlessly."',
    name: 'Meera R.',
    detail: 'Monthly gel client',
  },
  {
    text: '"Booked the press-on custom set for my photoshoot and they were absolutely stunning. Everyone on set thought they were salon-fresh extensions."',
    name: 'Aanya K.',
    detail: 'Press-on collection',
  },
]

type NavItem = {
  label: string
  page?: Page
  anchor?: string
  href?: string
}

const FAQS = [
  {
    question: 'How do I book an appointment?',
    answer:
      'Use the Book Now link in the navigation to email the studio with your preferred date, service, and any inspiration. We will confirm availability and send you the next steps.',
  },
  {
    question: 'How long does a set take?',
    answer:
      'Most manicures take 60 to 90 minutes. Builder-gel extensions, detailed nail art, and bridal sets can take two hours or more, so we always allow extra time for a relaxed appointment.',
  },
  {
    question: 'Can I bring my own inspiration photos?',
    answer:
      'Absolutely. Reference photos help us match the shape, colour, and finish you have in mind. We will adapt the design to suit your nail length and lifestyle.',
  },
  {
    question: 'How do I choose the right nail shape?',
    answer:
      'Start with the Shapes page to compare durability and suitable length for each silhouette. If you are still unsure, we will recommend a shape during your consultation based on your natural nails and daily routine.',
  },
  {
    question: 'How long will my manicure last?',
    answer:
      'Gel and builder-gel sets typically last two to four weeks with proper aftercare. Using cuticle oil daily, wearing gloves for household chores, and avoiding your nails as tools will help extend wear.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Please let us know at least 24 hours before your appointment if you need to reschedule or cancel. Late cancellations may incur a fee, and repeated no-shows may require a deposit for future bookings.',
  },
]

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', page: 'home', anchor: 'home' },
  { label: 'Services', page: 'home', anchor: 'services' },
  { label: 'Shapes', page: 'shapes' },
  { label: 'Nail Types', page: 'nail-types' },
  { label: 'Reviews', page: 'home', anchor: 'testimonials' },
  { label: 'FAQ', page: 'faq' },
  {
    label: 'Book Now',
    href: 'mailto:hello@auraatelier.in?subject=Booking%20request%20%E2%80%94%20Aura%20Atelier',
  },
]

const CURRENT_YEAR = new Date().getFullYear()

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <a
      href="#home"
      className="logo"
      aria-label="Aura Atelier home"
      onClick={(event) => {
        event.preventDefault()
        onClick()
      }}
    >
      <span className="logo-primary">AURA</span>
      <span className="logo-sub">ATELIER</span>
    </a>
  )
}

function SiteHeader({
  page,
  onNavigate,
}: {
  page: Page
  onNavigate: Navigate
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (next: Page, anchor?: string) => {
    setMobileOpen(false)
    onNavigate(next, anchor)
  }

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="header-inner">
        <Logo onClick={() => go('home', 'home')} />

        <nav className="main-nav" aria-label="Main navigation">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => {
              const current = item.page
                ? (item.page === 'home' &&
                    page === 'home' &&
                    item.anchor === 'home') ||
                  (item.page !== 'home' && page === item.page)
                : false
              return (
                <li key={item.label}>
                  {item.href ? (
                    <a className="nav-link nav-link--cta" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={`nav-link${current ? ' is-current' : ''}`}
                      aria-current={current ? 'page' : undefined}
                      onClick={() => item.page && go(item.page, item.anchor)}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="header-actions">
          <button
            className="hamburger"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <nav
        className={`mobile-nav${mobileOpen ? ' is-open' : ''}`}
        id="mobile-nav"
        aria-hidden={!mobileOpen}
      >
        <ul className="mobile-nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <a
                  className="mobile-nav-link mobile-nav-link--cta"
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => item.page && go(item.page, item.anchor)}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

function SiteFooter({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <Logo onClick={() => onNavigate('home', 'home')} />
          <p className="footer-tagline">
            Luxury nail artistry for the discerning few.
          </p>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <h4 className="footer-nav-label">Navigate</h4>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a className="footer-link-button" href={item.href}>
                    {item.label}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="footer-link-button"
                    onClick={() =>
                      item.page && onNavigate(item.page, item.anchor)
                    }
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-social">
          <h4 className="footer-nav-label">Follow Us</h4>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Instagram">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Pinterest">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.22-5.17 1.22-5.17s-.31-.62-.31-1.54c0-1.44.84-2.52 1.88-2.52.89 0 1.32.67 1.32 1.47 0 .9-.57 2.24-.87 3.48-.25 1.04.52 1.88 1.54 1.88 1.85 0 3.1-2.37 3.1-5.16 0-2.14-1.44-3.63-3.5-3.63-2.39 0-3.79 1.79-3.79 3.64 0 .72.28 1.49.62 1.91a.25.25 0 0 1 .06.24c-.06.26-.21.84-.24.95-.04.15-.13.18-.3.11-1.13-.53-1.84-2.19-1.84-3.52 0-2.87 2.09-5.5 6.02-5.5 3.16 0 5.62 2.25 5.62 5.26 0 3.14-1.98 5.66-4.72 5.66-.92 0-1.79-.48-2.09-1.04l-.57 2.12c-.21.79-.76 1.78-1.13 2.38.85.26 1.75.4 2.68.4 5.52 0 10-4.48 10-10S17.52 2 12 2Z" />
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.76a4.85 4.85 0 0 1-1.02-.07Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {CURRENT_YEAR} Aura Atelier. All rights reserved.</p>
          <p>
            <a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function HomePage({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <main id="main-content">
      <section className="hero" id="home">
        <div className="hero-inner">
          <p className="eyebrow fade-up">Luxury Nail Artistry</p>
          <h1 className="hero-headline fade-up delay-1">
            Where Every Nail
            <br />
            Becomes a <em>Masterpiece</em>
          </h1>
          <p className="hero-subtext fade-up delay-2">
            Bespoke nail art crafted with precision, passion, and couture-level
            care.
            <br />
            Your hands deserve nothing less.
          </p>
          <div className="hero-actions fade-up delay-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('home', 'services')}
            >
              Explore Services
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('shapes')}
            >
              View Shape Library
            </button>
          </div>
        </div>
        <div className="hero-gradient" aria-hidden="true"></div>
      </section>

      <section className="services section alt-bg" id="services">
        <div className="container">
          <div className="section-intro fade-up">
            <p className="section-label">What We Offer</p>
            <h2 className="section-heading">Our Signature Services</h2>
            <p className="section-subtext">
              Each service is designed around your vision and executed with
              gallery-worthy precision.
            </p>
          </div>

          <div className="services-grid">
            {SERVICES.map((service, index) => (
              <article
                className={`service-card fade-up delay-${(index % 3) + 1}`}
                key={service.title}
              >
                <div className="card-icon" aria-hidden="true">
                  {service.icon}
                </div>
                <h3 className="card-title">{service.title}</h3>
                <p className="card-text">{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials section alt-bg" id="testimonials">
        <div className="container">
          <div className="section-intro fade-up">
            <p className="section-label">Client Love</p>
            <h2 className="section-heading">What Our Clients Say</h2>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((testimonial, index) => (
              <blockquote
                className={`testimonial-card fade-up delay-${index + 1}`}
                key={testimonial.name}
              >
                <p className="testimonial-text">{testimonial.text}</p>
                <footer className="testimonial-author">
                  <span className="author-name">{testimonial.name}</span>
                  <span className="author-detail">{testimonial.detail}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function ShapeCard({ shape }: { shape: Shape }) {
  const front: ReactNode = (
    <div className="shape-flip-front">
      <img src={shape.image} alt={`${shape.name} nail shape`} />
      <div className="shape-flip-front-caption">
        <span className="shape-flip-front-name">{shape.name}</span>
        <span className="shape-flip-front-hint">
          Flip for durability &amp; length
        </span>
      </div>
    </div>
  )

  const back: ReactNode = (
    <div className="shape-flip-back">
      <p className="shape-flip-kicker">{shape.name} · Shape notes</p>
      <div className="shape-flip-row">
        <span className="shape-flip-label">Durability</span>
        <p className="shape-flip-value">{shape.durability}</p>
        <p className="shape-flip-note">{shape.durabilityNote}</p>
      </div>
      <div className="shape-flip-row">
        <span className="shape-flip-label">Suitable length</span>
        <p className="shape-flip-value">{shape.length}</p>
        <p className="shape-flip-note">{shape.lengthNote}</p>
      </div>
      <p className="shape-flip-foot">Tap, drag or press Enter to flip back</p>
    </div>
  )

  return (
    <CardFlip
      className="shape-flip-card"
      faceClassName="shape-flip-face"
      label={`${shape.name} nail shape card`}
      front={front}
      back={back}
    />
  )
}

function ShapesPage({ onNavigate }: { onNavigate: Navigate }) {
  const [filter, setFilter] = useState('all')
  const visibleShapes = SHAPES.filter(
    (shape) => filter === 'all' || shape.slug === filter,
  )

  return (
    <main id="main-content">
      <section className="shapes-hero">
        <div className="shapes-hero-inner">
          <p className="eyebrow fade-up">The Shape Library</p>
          <h1 className="shapes-hero-headline fade-up delay-1">
            Every Silhouette,
            <br />
            <em>Perfected</em>
          </h1>
          <p className="shapes-hero-subtext fade-up delay-2">
            From soft almond to statement stiletto, explore the silhouettes that
            define the Aura Atelier finish — each one sculpted with precision and
            care. Flip a card to discover its durability and the length it wears
            best.
          </p>
          <div className="shapes-hero-meta fade-up delay-3">
            <span>
              <strong>{SHAPES.length}</strong> signature shapes
            </span>
            <span className="shapes-hero-dot" aria-hidden="true"></span>
            <span>Classic to statement</span>
          </div>
        </div>
      </section>

      <div className="shape-filter-bar">
        <div className="shape-filter-inner">
          <span className="shape-filter-label">Filter</span>
          <div
            className="shape-filter-list"
            role="group"
            aria-label="Filter shapes"
          >
            <button
              type="button"
              className={`shape-filter-button${filter === 'all' ? ' is-active' : ''}`}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {SHAPES.map((shape) => (
              <button
                type="button"
                className={`shape-filter-button${
                  filter === shape.slug ? ' is-active' : ''
                }`}
                aria-pressed={filter === shape.slug}
                key={shape.slug}
                onClick={() => setFilter(shape.slug)}
              >
                {shape.name}
              </button>
            ))}
          </div>
          <p className="shape-filter-count" aria-live="polite">
            Showing {visibleShapes.length} of {SHAPES.length} shapes
          </p>
        </div>
      </div>

      <div className="shape-sections">
        {SHAPES.map((shape, index) => {
          const hidden = filter !== 'all' && filter !== shape.slug
          return (
            <section
              className="shape-section"
              id={`shape-${shape.slug}`}
              data-shape={shape.slug}
              hidden={hidden}
              key={shape.slug}
            >
              <div className="shape-section-inner">
                <header className="shape-section-head">
                  <div className="shape-heading-wrap">
                    <p className="shape-index">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {String(SHAPES.length).padStart(2, '0')}
                    </p>
                    <h2 className="shape-name">{shape.name}</h2>
                  </div>
                </header>

                <div className="shape-flip-grid">
                  <ShapeCard shape={shape} />
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <section className="shapes-cta">
        <div className="container shapes-cta-inner">
          <p className="section-label">Keep Exploring</p>
          <h2 className="section-heading">Discover Nail Types</h2>
          <p className="section-subtext">
            From gel to acrylic, explore the application techniques that bring
            every silhouette to life.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('nail-types')}
          >
            Explore Nail Types
          </button>
        </div>
      </section>
    </main>
  )
}

function NailTypesPage() {
  const [filter, setFilter] = useState('all')
  const visibleTypes = NAIL_TYPES.filter(
    (type) => filter === 'all' || type.slug === filter,
  )

  return (
    <>
      <div className="page-aura" aria-hidden="true">
        <span className="aura-blob aura-blob--greige"></span>
        <span className="aura-blob aura-blob--cherry"></span>
        <span className="aura-blob aura-blob--oat"></span>
      </div>

      <main id="main-content">
        <section className="nail-types-hero">
          <div className="nail-types-hero-inner">
            <p className="eyebrow fade-up">The Application Library</p>
            <h1 className="nail-types-hero-title fade-up delay-1">
              Nail <em>Types</em>
            </h1>
            <p className="nail-types-hero-subtext fade-up delay-2">
              Six application techniques, one atelier standard. Filter the
              collection and watch each technique in motion.
            </p>
            <div className="nail-types-hero-meta fade-up delay-3">
              <span>
                <strong>{NAIL_TYPES.length}</strong> application types
              </span>
              <span className="nail-types-hero-dot" aria-hidden="true"></span>
              <span>
                <strong>{NAIL_TYPES.length}</strong> technique films
              </span>
            </div>
          </div>
        </section>

        <div className="nail-types-filter-bar glass">
          <div className="nail-types-filter-inner">
            <span className="nail-types-filter-label">Filter</span>
            <div
              className="nail-types-filter-list"
              role="group"
              aria-label="Filter nail types"
            >
              <button
                type="button"
                className={`nail-types-filter-btn glass-btn${
                  filter === 'all' ? ' is-active' : ''
                }`}
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {NAIL_TYPES.map((type) => (
                <button
                  type="button"
                  className={`nail-types-filter-btn glass-btn${
                    filter === type.slug ? ' is-active' : ''
                  }`}
                  aria-pressed={filter === type.slug}
                  key={type.slug}
                  onClick={() => setFilter(type.slug)}
                >
                  {type.name}
                </button>
              ))}
            </div>
            <p className="nail-types-filter-count" aria-live="polite">
              Showing {visibleTypes.length} of {NAIL_TYPES.length} types
            </p>
          </div>
        </div>

        <div className="nail-types-sections">
          {NAIL_TYPES.map((type, index) => {
            const hidden = filter !== 'all' && filter !== type.slug
            return (
              <section
                className="nail-type-section"
                id={`nail-type-${type.slug}`}
                data-type={type.slug}
                hidden={hidden}
                key={type.slug}
              >
                <div className="nail-type-head glass">
                  <div className="nail-type-head-copy">
                    <h2 className="nail-type-name">{type.name}</h2>
                  </div>
                  <p className="nail-type-count">
                    {String(index + 1).padStart(2, '0')} /{' '}
                    {String(NAIL_TYPES.length).padStart(2, '0')}
                  </p>
                </div>

                <div className="nail-type-grid">
                  <figure className="nail-media-card">
                    <video
                      className="nail-media-video"
                      src={type.video}
                      poster={type.poster}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      aria-label={`${type.name} nail technique video`}
                    />
                    <figcaption className="nail-media-caption">
                      <span className="nail-media-name">{type.name}</span>
                      <span className="nail-media-meta">Film 01</span>
                    </figcaption>
                  </figure>
                  <aside className="nail-type-info">
                    <p className="nail-type-info-label">About {type.name}</p>
                    <p className="nail-type-description">{type.description}</p>
                  </aside>
                </div>
              </section>
            )
          })}
        </div>
      </main>
    </>
  )
}

function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <main id="main-content">
      <section className="faq-hero">
        <div className="faq-hero-inner">
          <p className="eyebrow fade-up">Good to Know</p>
          <h1 className="faq-hero-title fade-up delay-1">
            Frequently Asked <em>Questions</em>
          </h1>
          <p className="faq-hero-subtext fade-up delay-2">
            Everything you need to know before your visit — from booking and
            timings to aftercare and cancellations.
          </p>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-list">
            {FAQS.map((faq, index) => {
              const isOpen = openIndex === index
              return (
                <article
                  className={`faq-item${isOpen ? ' is-open' : ''}`}
                  key={faq.question}
                >
                  <h2 className="faq-question">
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-arrow" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                  </h2>
                  <div
                    className="faq-answer"
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-hidden={!isOpen}
                  >
                    <div className="faq-answer-inner">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

function pageTitle(page: Page) {
  if (page === 'shapes') return 'Shapes | Aura Atelier'
  if (page === 'nail-types') return 'Nail Types | Aura Atelier'
  if (page === 'faq') return 'FAQ | Aura Atelier'
  return 'Aura Atelier'
}

function App() {
  const [page, setPage] = useState<Page>('home')

  const navigate: Navigate = (next, anchor) => {
    setPage(next)
    if (anchor) {
      window.setTimeout(() => {
        document
          .getElementById(anchor)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    document.documentElement.classList.add('js')
  }, [])

  useEffect(() => {
    document.title = pageTitle(page)
    document.body.classList.toggle('nail-types-page', page === 'nail-types')
    return () => document.body.classList.remove('nail-types-page')
  }, [page])

  useEffect(() => {
    const items = document.querySelectorAll(
      '.fade-up, .fade-left, .fade-right',
    )

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    items.forEach((item) => {
      item.classList.remove('is-visible')
      observer.observe(item)
    })

    return () => observer.disconnect()
  }, [page])

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader page={page} onNavigate={navigate} />
      {page === 'home' && <HomePage onNavigate={navigate} />}
      {page === 'shapes' && <ShapesPage onNavigate={navigate} />}
      {page === 'nail-types' && <NailTypesPage />}
      {page === 'faq' && <FaqPage />}
      <SiteFooter onNavigate={navigate} />
    </>
  )
}

export default App
