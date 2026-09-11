#!/usr/bin/env python3
"""Patch live App.tsx to wire Saudi market slice + legal routes."""
from pathlib import Path

p = Path("/tmp/usil-live/src/App.tsx")
s = p.read_text()

old_imp = """import { TrustAndExperience } from './components/TrustAndExperience';
import { Footer } from './components/Footer';
"""
new_imp = """import { TrustAndExperience } from './components/TrustAndExperience';
import { Footer } from './components/Footer';
import { SaudiSeasonStrip } from './components/market/SaudiSeasonStrip';
import { OccasionPackages } from './components/market/OccasionPackages';
import { MarketSolutions } from './components/market/MarketSolutions';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { TermsOfUse } from './components/legal/TermsOfUse';
"""
if old_imp not in s:
    raise SystemExit("import block missing")
s = s.replace(old_imp, new_imp, 1)

old_state = """  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('جميع المدن');
  const [searchQuery, setSearchQuery] = useState('');
"""
new_state = """  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('جميع المدن');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
"""
if old_state not in s:
    raise SystemExit("state block missing")
s = s.replace(old_state, new_state, 1)

# Legal hash/path routing after first client-bookings effect
old_effect_anchor = """  }, [currentUser]);

  const showEventTracker = useMemo(
"""
new_effect_anchor = """  }, [currentUser]);

  useEffect(() => {
    const applyLegalFromLocation = () => {
      const path = window.location.pathname.replace(/\\/$/, '') || '/';
      const hash = window.location.hash.replace(/^#/, '');
      if (path === '/privacy' || hash === 'privacy') setLegalPage('privacy');
      else if (path === '/terms' || hash === 'terms') setLegalPage('terms');
    };
    applyLegalFromLocation();
    window.addEventListener('popstate', applyLegalFromLocation);
    window.addEventListener('hashchange', applyLegalFromLocation);
    return () => {
      window.removeEventListener('popstate', applyLegalFromLocation);
      window.removeEventListener('hashchange', applyLegalFromLocation);
    };
  }, []);

  useEffect(() => {
    if (legalPage === 'privacy' && window.location.pathname !== '/privacy') {
      window.history.replaceState({}, '', '/privacy');
    } else if (legalPage === 'terms' && window.location.pathname !== '/terms') {
      window.history.replaceState({}, '', '/terms');
    } else if (!legalPage && (window.location.pathname === '/privacy' || window.location.pathname === '/terms')) {
      window.history.replaceState({}, '', '/');
    }
  }, [legalPage]);

  const showEventTracker = useMemo(
"""
if old_effect_anchor not in s:
    raise SystemExit("effect anchor missing")
s = s.replace(old_effect_anchor, new_effect_anchor, 1)

old_filter = """      // City filter
      if (selectedCity !== 'جميع المدن' && !item.cities.includes(selectedCity)) {
        return false;
      }
      // Search query
"""
new_filter = """      // City filter
      if (selectedCity !== 'جميع المدن' && !item.cities.includes(selectedCity)) {
        return false;
      }
      // Audience: رجال / نساء / عائلي / شركات
      if (selectedAudience !== 'all') {
        const a = item.audience || 'family';
        const matchesExact = a === selectedAudience;
        const familyFitsMenWomen =
          a === 'family' && (selectedAudience === 'women' || selectedAudience === 'men');
        if (!matchesExact && !familyFitsMenWomen) {
          return false;
        }
      }
      // Search query
"""
if old_filter not in s:
    raise SystemExit("filter block missing")
s = s.replace(old_filter, new_filter, 1)

old_deps = """  }, [selectedCategory, selectedCity, searchQuery, sortBy]);
"""
new_deps = """  }, [selectedCategory, selectedCity, selectedAudience, searchQuery, sortBy]);
"""
if old_deps not in s:
    raise SystemExit("filter deps missing")
s = s.replace(old_deps, new_deps, 1)

old_bar = """              <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalServicesCount={filteredServices.length}
              />
"""
new_bar = """              <CategoryFilterBar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalServicesCount={filteredServices.length}
                selectedAudience={selectedAudience}
                onSelectAudience={setSelectedAudience}
              />
"""
if old_bar not in s:
    raise SystemExit("filter bar missing")
s = s.replace(old_bar, new_bar, 1)

old_market = """          {/* Main Content Area */}
          <main className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 flex-1 space-y-16">
            
            {/* Services Marketplace Section */}
"""
new_market = """          {/* Main Content Area */}
          <main className="container mx-auto px-4 lg:px-8 py-10 lg:py-16 flex-1 space-y-16">
            <SaudiSeasonStrip />
            <OccasionPackages
              onPick={(category, audience) => {
                setSelectedCategory(category);
                setSelectedAudience(audience);
              }}
            />
            <MarketSolutions />

            {/* Services Marketplace Section */}
"""
if old_market not in s:
    raise SystemExit("main content missing")
s = s.replace(old_market, new_market, 1)

old_empty = """                      setSelectedCategory('all');
                      setSelectedCity('جميع المدن');
                      setSearchQuery('');
"""
new_empty = """                      setSelectedCategory('all');
                      setSelectedCity('جميع المدن');
                      setSelectedAudience('all');
                      setSearchQuery('');
"""
if old_empty not in s:
    raise SystemExit("empty reset missing")
s = s.replace(old_empty, new_empty, 1)

old_footer = """          <Footer
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              window.scrollTo({ top: 500, behavior: 'smooth' });
            }}
          />
"""
new_footer = """          {legalPage && (
            <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#F7F5F0]">
              {legalPage === 'privacy' ? (
                <PrivacyPolicy onBack={() => setLegalPage(null)} />
              ) : (
                <TermsOfUse onBack={() => setLegalPage(null)} />
              )}
            </div>
          )}

          <Footer
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              window.scrollTo({ top: 500, behavior: 'smooth' });
            }}
            onPrivacy={() => setLegalPage('privacy')}
            onTerms={() => setLegalPage('terms')}
          />
"""
if old_footer not in s:
    raise SystemExit("footer missing")
s = s.replace(old_footer, new_footer, 1)

p.write_text(s)
print("App.tsx patched", len(s), "chars,", s.count("\n"), "lines")
