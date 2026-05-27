import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Lock,
  Mail,
  Map,
  MapPin,
  MessageSquareText,
  Navigation,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Demo', href: '#demo' },
  { label: 'FAQ', href: '#faq' },
];

const proofItems = ['City stays', 'Boutique hotels', 'Homestays', 'Family resorts', 'Long stays'];

const benefits = [
  {
    icon: Bot,
    title: 'AI search that asks better questions',
    text: 'Turn loose trip ideas into precise filters for location, budget, amenities, stay style, and tradeoffs.',
  },
  {
    icon: Map,
    title: 'Map-first comparison',
    text: 'See ranked stays, local context, travel time, saved places, and route decisions in one focused workspace.',
  },
  {
    icon: MessageSquareText,
    title: 'Place-specific answers',
    text: 'Ask about noise, check-in, workspace quality, family fit, nearby food, and recent guest signals.',
  },
  {
    icon: Users,
    title: 'Community-backed confidence',
    text: 'Reviews, Q&A, check-ins, and onsite signals help travelers judge whether a stay fits real needs.',
  },
];

const workflow = [
  ['Before', 'Describe the trip, constraints, and ideal stay in natural language.'],
  ['During', 'Compare shortlisted places on the map while the assistant refines filters.'],
  ['After', 'Save, review, and revisit decisions from your profile.'],
  ['In-between', 'Use check-ins and Q&A to improve recommendations for the next trip.'],
];

const testimonials = [
  ['Linh Tran', 'Remote worker', 'Smacco narrowed a messy search into three stays that actually matched my work setup and budget.'],
  ['Minh Pham', 'Family traveler', 'The map and place questions made it much easier to choose a quiet family-friendly area.'],
  ['An Nguyen', 'Boutique host', 'The listing detail page surfaces the practical questions guests ask before booking.'],
];

const faqs = [
  ['Is Smacco only for hotels?', 'No. It supports hotels, homestays, apartments, villas, resorts, guesthouses, and other stay types.'],
  ['Does the AI book rooms directly?', 'The current product focuses on search, comparison, place intelligence, and booking decision support.'],
  ['What data improves recommendations?', 'Search context, reviews, Q&A, saved places, check-ins, amenities, and place metadata can all influence ranking.'],
  ['Can I use it on mobile?', 'Yes. The landing page and protected search workspace stack cleanly for smaller screens.'],
];

const mockPlaces = [
  ['Moss Courtyard Stay', 'Quiet lane, kitchenette, strong Wi-Fi', '4.9', '$42'],
  ['Harborline Hotel', 'Walkable, late check-in, city view', '4.8', '$68'],
  ['Palm House Villa', 'Family rooms, pool, local breakfast', '4.7', '$94'],
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [prompt, setPrompt] = useState('Find a quiet stay in Da Lat with a desk, kitchen, and easy taxi access under $55/night');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser, login, loginWithGoogle } = useAuth();

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Landing email login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
      console.error('Landing Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-base-50/82 backdrop-blur-2xl">
        <div className="section-shell flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Smacco home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-base-200 bg-white shadow-soft">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-black leading-5 text-ink-900">Smacco</span>
              <span className="hidden text-xs font-bold uppercase tracking-wide text-primary-700 sm:block">AI stay search</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-base-200 bg-white/70 p-1 shadow-soft backdrop-blur xl:flex" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="btn-ghost rounded-full px-4 py-2">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex btn-secondary px-4 py-2.5">
              Log in
            </Link>
            <Link to={currentUser ? '/app' : '#signin'} className="btn-primary shrink-0 px-3 py-2.5 sm:px-4">
              <span className="sm:hidden">{currentUser ? 'Open' : 'Start'}</span>
              <span className="hidden sm:inline">{currentUser ? 'Open app' : 'Start search'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-base-200/70">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_18%,rgba(47,183,156,0.22),transparent_28rem),radial-gradient(circle_at_85%_12%,rgba(249,115,22,0.18),transparent_26rem)]" />
          <div className="section-shell grid min-h-[calc(100vh-5rem)] items-center gap-12 py-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-3xl">
              <div className="badge-soft mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Accommodation decisions with AI context
              </div>
              <h1 className="heading-xl">
                Find the stay that fits the trip, not just the dates.
              </h1>
              <p className="body-muted mt-6 max-w-2xl text-base sm:text-lg">
                Smacco combines conversational search, ranked accommodation cards, map context, place Q&A, and community signals so travelers can compare stays with less tab switching.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#signin" className="btn-primary min-h-[3.25rem]">
                  Plan a stay
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#demo" className="btn-secondary min-h-[3.25rem]">
                  Try the prompt
                  <Search className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ['Signals', 'reviews, Q&A, check-ins'],
                  ['Workspace', 'chat, map, saved places'],
                  ['Focus', 'accommodation fit'],
                ].map(([label, value]) => (
                  <div key={label} className="surface-panel p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-primary-700">{label}</p>
                    <p className="mt-2 text-sm font-bold text-ink-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="surface-card overflow-hidden p-3">
                <div className="rounded-[1.35rem] border border-base-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <Map className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-ink-900">Stay search workspace</p>
                        <p className="text-xs font-semibold text-ink-500">Da Lat · quiet · work-friendly</p>
                      </div>
                    </div>
                    <span className="badge-warm normal-case tracking-normal">AI ranked</span>
                  </div>

                  <div className="grid min-h-[31rem] bg-base-50 lg:grid-cols-[1fr_20rem]">
                    <div className="relative overflow-hidden bg-[linear-gradient(135deg,#d6f4ec_0%,#fbf8f3_48%,#ffedd5_100%)]">
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,28,23,0.06)_1px,transparent_1px),linear-gradient(rgba(34,28,23,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
                      <div className="absolute left-10 top-12 h-28 w-44 rounded-[42%] bg-white/70 shadow-soft" />
                      <div className="absolute bottom-10 right-8 h-36 w-52 rounded-[45%] bg-primary-100/70 shadow-soft" />
                      <div className="absolute left-[12%] top-[42%] h-3 w-[70%] rotate-[-15deg] rounded-full bg-white/95 shadow-soft" />
                      <div className="absolute bottom-[22%] left-[18%] h-3 w-[66%] rotate-[9deg] rounded-full bg-white/95 shadow-soft" />
                      {[
                        ['left-[25%] top-[35%]', 'Homestay', Home],
                        ['left-[60%] top-[29%]', 'Hotel', KeyRound],
                        ['left-[70%] top-[68%]', 'Villa', Wifi],
                      ].map(([position, label, Icon], index) => (
                        <div key={label} className={`absolute ${position} -translate-x-1/2 -translate-y-1/2`}>
                          <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-card ring-4 ring-white/80 ${index === 1 ? 'bg-accent-500' : 'bg-primary-600'}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap rounded-full border border-base-200 bg-white px-3 py-1 text-xs font-black text-ink-700 shadow-soft">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-base-200 bg-white/90 p-4 lg:border-l lg:border-t-0">
                      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-base-200 bg-base-50 px-3 py-3">
                        <Search className="h-4 w-4 text-primary-700" />
                        <span className="text-sm font-bold text-ink-700">quiet stay with kitchen</span>
                      </div>
                      <div className="space-y-3">
                        {mockPlaces.map(([name, detail, rating, price]) => (
                          <div key={name} className="rounded-2xl border border-base-200 bg-white p-3 shadow-soft">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-ink-900">{name}</p>
                                <p className="mt-1 text-xs font-semibold leading-5 text-ink-500">{detail}</p>
                              </div>
                              <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-black text-primary-700">{price}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs font-bold text-ink-500">
                              <span className="inline-flex items-center gap-1 text-accent-600">
                                <Star className="h-3.5 w-3.5 fill-accent-500" />
                                {rating}
                              </span>
                              <span>92% fit</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad border-b border-base-200/70 bg-white/45">
          <div className="section-shell">
            <p className="text-center text-sm font-black uppercase tracking-wide text-ink-500">Built for accommodation discovery across stay types</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {proofItems.map((item) => (
                <span key={item} className="rounded-full border border-base-200 bg-white/75 px-4 py-2 text-sm font-black text-ink-700 shadow-soft">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="section-pad">
          <div className="section-shell">
            <div className="max-w-2xl">
              <p className="badge-soft">Product benefits</p>
              <h2 className="heading-lg mt-4">A calmer way to search, filter, compare, and decide.</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className="surface-card-solid p-5 transition hover:-translate-y-1 hover:border-primary-200">
                    <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-black text-ink-900">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-ink-500">{benefit.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-pad border-y border-base-200/70 bg-white/50">
          <div className="section-shell space-y-16">
            {[
              ['Search panel', 'Use structured filters without losing the natural-language context that started the search.', SlidersHorizontal],
              ['Listing detail', 'Inspect reviews, amenities, onsite status, Q&A, map position, and booking confidence in one page.', CalendarCheck],
            ].map(([title, text, Icon], index) => (
              <div key={title} className={`grid items-center gap-8 lg:grid-cols-2 ${index % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                <div>
                  <p className="badge-warm">Accommodation flow</p>
                  <h2 className="heading-lg mt-4">{title}</h2>
                  <p className="body-muted mt-4">{text}</p>
                </div>
                <div className="surface-card p-5">
                  <div className="rounded-2xl border border-base-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-black text-ink-900">{title}</p>
                        <p className="text-sm font-semibold text-ink-500">Reusable cards, badges, inputs, and CTAs</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {['Quiet room', 'Fast Wi-Fi', 'Flexible check-in'].map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-2xl bg-base-50 px-4 py-3">
                          <span className="text-sm font-bold text-ink-700">{item}</span>
                          <CheckCircle2 className="h-4 w-4 text-primary-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="section-pad">
          <div className="section-shell">
            <div className="max-w-2xl">
              <p className="badge-soft">Workflow</p>
              <h2 className="heading-lg mt-4">Before, during, after, and between every stay decision.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {workflow.map(([step, text], index) => (
                <article key={step} className="surface-card-solid p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-sm font-black text-white">{index + 1}</span>
                  <h3 className="mt-5 text-xl font-black text-ink-900">{step}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink-500">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="section-pad border-y border-base-200/70 bg-primary-50/45">
          <div className="section-shell grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="badge-soft">Prompt demo</p>
              <h2 className="heading-lg mt-4">Start with the way travelers actually talk.</h2>
              <p className="body-muted mt-4">The product can translate intent into filters, ranking reasons, map context, and place-level follow-up questions.</p>
            </div>
            <div className="surface-card p-5">
              <label htmlFor="demo-prompt" className="text-sm font-black text-ink-700">Accommodation prompt</label>
              <textarea
                id="demo-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="mt-3 min-h-32 w-full rounded-2xl border border-base-200 bg-white/90 p-4 text-sm font-semibold leading-7 text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary">
                  Generate shortlist
                  <Sparkles className="h-4 w-4" />
                </button>
                <button type="button" className="btn-secondary">
                  Add map context
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="section-pad">
          <div className="section-shell grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="badge-soft">Trust and security</p>
              <h2 className="heading-lg mt-4">Private account flows and practical trust signals.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [ShieldCheck, 'Firebase authentication for protected app access.'],
                [Lock, 'Saved places and profile data stay behind authenticated routes.'],
                [Users, 'Community reviews and Q&A add human context.'],
                [Navigation, 'Location features request browser permission before use.'],
              ].map(([Icon, text]) => (
                <div key={text} className="surface-card-solid flex gap-3 p-5">
                  <Icon className="mt-1 h-5 w-5 text-primary-700" />
                  <p className="text-sm font-bold leading-7 text-ink-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad border-y border-base-200/70 bg-white/50">
          <div className="section-shell">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="badge-warm">Testimonials</p>
                <h2 className="heading-lg mt-4">Travelers use Smacco to reduce uncertainty.</h2>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-black text-accent-600">
                <Star className="h-4 w-4 fill-accent-500" />
                4.8 average beta rating
              </div>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {testimonials.map(([name, role, quote]) => (
                <article key={name} className="surface-card-solid p-6">
                  <p className="text-sm leading-7 text-ink-700">"{quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-black text-primary-700">{name[0]}</span>
                    <div>
                      <p className="text-sm font-black text-ink-900">{name}</p>
                      <p className="text-xs font-semibold text-ink-500">{role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="section-pad border-y border-base-200/70 bg-white/50">
          <div className="section-shell grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="badge-soft">FAQ</p>
              <h2 className="heading-lg mt-4">Common questions.</h2>
            </div>
            <div className="space-y-3">
              {faqs.map(([question, answer]) => (
                <details key={question} className="surface-card-solid group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-ink-900">
                    {question}
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-ink-500">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="signin" className="section-pad">
          <div className="section-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="badge-warm">Get started</p>
              <h2 className="heading-lg mt-4">Open the app and search with your trip context saved.</h2>
              <p className="body-muted mt-4">Sign in to access the protected map workspace, saved places, reviews, and profile flows.</p>
            </div>
            <div className="surface-card p-6 sm:p-8">
              {currentUser ? (
                <div className="flex min-h-72 flex-col items-start justify-center">
                  <p className="text-sm font-black text-primary-700">Signed in</p>
                  <h3 className="mt-2 text-2xl font-black text-ink-900">{currentUser.displayName || currentUser.email}</h3>
                  <Link to="/app" className="btn-primary mt-6">
                    Open Smacco
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-ink-900">Sign in</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">Continue to the accommodation search workspace.</p>

                  {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

                  <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="landing-email" className="mb-2 block text-sm font-black text-ink-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500/55" />
                        <input id="landing-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} placeholder="you@example.com" className="input-field pl-12" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="landing-password" className="mb-2 block text-sm font-black text-ink-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500/55" />
                        <input id="landing-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} placeholder="••••••••" className="input-field pl-12 pr-12" />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-500 transition hover:bg-base-100 hover:text-ink-900" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full">
                      {isLoading ? 'Signing in...' : 'Sign in and search'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-base-200" />
                    <span className="text-xs font-black uppercase text-ink-500">Or</span>
                    <div className="h-px flex-1 bg-base-200" />
                  </div>

                  <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="btn-secondary w-full">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-xs font-black text-white">G</span>
                    {isLoading ? 'Processing...' : 'Continue with Google'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-200 bg-ink-900 py-12 text-white">
        <div className="section-shell flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-black">Smacco</p>
              <p className="text-sm text-white/60">AI-powered accommodation search and map comparison.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-white/70">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white">{link.label}</a>
            ))}
            <Link to="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
