import { useEffect, useRef, useState } from 'react';

// Free alternative using OpenStreetMap Nominatim (no billing required)
// This implementation queries Nominatim for suggestions and parses results.
// Note: Nominatim has usage policies and rate limits; for production consider a hosted geocoder or self-hosting.

export default function AddressAutocomplete({ onAddressSelect, placeholder = 'Enter your address' }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef(null);

  // Gujarat viewbox: left, top, right, bottom (Nominatim expects left,top,right,bottom)
  const viewbox = '68.0,25.0,75.0,20.0';

  useEffect(() => {
    // debounce queries to avoid hitting rate limits
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query.trim());
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function fetchSuggestions(q) {
    try {
      // Use Nominatim public API (suitable for low-traffic, dev use)
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&viewbox=${encodeURIComponent(
        viewbox
      )}&bounded=1&q=${encodeURIComponent(q)}`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });
      if (!res.ok) throw new Error('Geocode server error');
      const data = await res.json();
      const mapped = (data || []).map(item => ({
        id: item.place_id,
        display: item.display_name,
        raw: item,
      }));
      setSuggestions(mapped);
      setShowSuggestions(mapped.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.warn('Nominatim error', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleChange(e) {
    setQuery(e.target.value);
  }

  function handleKeyDown(e) {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(s) {
    setShowSuggestions(false);
    setQuery(s.display);
    // Parse Nominatim address details
    const addr = s.raw.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const postalCode = addr.postcode || '';
    const road = addr.road || '';
    const house = addr.house_number || '';
    const addressLine = [house, road].filter(Boolean).join(' ').trim() || s.display.split(',')[0];

    onAddressSelect({
      fullAddress: s.display,
      address: addressLine,
      city,
      postalCode,
      state: addr.state || 'Gujarat',
    });
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border p-2 w-full mb-3 rounded"
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              className={`p-2 cursor-pointer hover:bg-gray-100 ${idx === selectedIndex ? 'bg-blue-50' : ''}`}
              onMouseDown={(ev) => {
                ev.preventDefault();
                selectSuggestion(s);
              }}
            >
              <div className="text-sm">{s.display}</div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-600 mt-1 mb-2">Suggestions powered by OpenStreetMap (Gujarat)</div>
    </div>
  );
}