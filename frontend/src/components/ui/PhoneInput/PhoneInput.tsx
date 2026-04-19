import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/lib/locale';
import styles from './PhoneInput.module.css';

const ARAB_COUNTRIES = [
  { code: '+20', iso: 'EG', nameAr: 'مصر', nameEn: 'Egypt', flag: '🇪🇬', regex: /^(10|11|12|15)[0-9]{8}$/ },
  { code: '+966', iso: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦', regex: /^5[0-9]{8}$/ },
  { code: '+971', iso: 'AE', nameAr: 'الإمارات', nameEn: 'UAE', flag: '🇦🇪', regex: /^5[0-9]{8}$/ },
  { code: '+965', iso: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼', regex: /^[569][0-9]{7}$/ },
  { code: '+974', iso: 'QA', nameAr: 'قطر', nameEn: 'Qatar', flag: '🇶🇦', regex: /^[3567][0-9]{7}$/ },
  { code: '+973', iso: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', flag: '🇧🇭', regex: /^3[0-9]{7}$/ },
  { code: '+968', iso: 'OM', nameAr: 'عمان', nameEn: 'Oman', flag: '🇴🇲', regex: /^[79][0-9]{7}$/ },
  { code: '+962', iso: 'JO', nameAr: 'الأردن', nameEn: 'Jordan', flag: '🇯🇴', regex: /^7[0-9]{8}$/ },
  { code: '+961', iso: 'LB', nameAr: 'لبنان', nameEn: 'Lebanon', flag: '🇱🇧', regex: /^[378][0-9]{6,7}$/ },
  { code: '+212', iso: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', flag: '🇲🇦', regex: /^[67][0-9]{8}$/ },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  onValidate?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function PhoneInput({ value, onChange, onValidate, placeholder, className = '', error = false }: PhoneInputProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value to extract country code and phone number
  // If no match found, default to Egypt (+20)
  const matchedCountry = ARAB_COUNTRIES.find(c => value.startsWith(c.code)) || ARAB_COUNTRIES[0];
  const [selectedCountry, setSelectedCountry] = useState(matchedCountry);
  
  // Extract just the number without the code
  const numberWithoutCode = value.startsWith(selectedCountry.code) 
    ? value.substring(selectedCountry.code.length) 
    : value;

  const [phoneNumber, setPhoneNumber] = useState(numberWithoutCode);

  useEffect(() => {
    // Initial validation check
    if (onValidate) {
      onValidate(selectedCountry.regex.test(phoneNumber));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: typeof ARAB_COUNTRIES[0]) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    onChange(`${country.code}${phoneNumber}`);
    if (onValidate) onValidate(country.regex.test(phoneNumber));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const newNumber = e.target.value.replace(/\D/g, '');
    setPhoneNumber(newNumber);
    onChange(`${selectedCountry.code}${newNumber}`);
    if (onValidate) onValidate(selectedCountry.regex.test(newNumber));
  };

  const filteredCountries = ARAB_COUNTRIES.filter(c => 
    c.nameEn.toLowerCase().includes(search.toLowerCase()) || 
    c.nameAr.includes(search) || 
    c.code.includes(search)
  );

  return (
    <div className={`${styles.wrapper} ${className}`} ref={dropdownRef}>
      {/* Target area acting as a flex container */}
      <div className={`${styles.inputContainer} ${error ? styles.errorContainer : ''}`}>
        {/* Country Selector Button */}
        <button 
          type="button"
          className={styles.countryBtn}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={styles.flag}>{selectedCountry.flag}</span>
          <span className={styles.code}>{selectedCountry.code}</span>
          <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>▼</span>
        </button>

        <div className={styles.divider}></div>

        {/* Phone Number Input */}
        <input
          type="tel"
          dir="ltr"
          className={styles.numberInput}
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || (locale === 'ar' ? '1X XXX XXXX' : '1X XXX XXXX')}
          autoComplete="tel-national"
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text"
              className={styles.searchInput}
              placeholder={locale === 'ar' ? 'ابحث عن دولة أو رمز...' : 'Search country or code...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className={styles.countryList}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map(country => (
                <button
                  key={country.iso}
                  type="button"
                  className={`${styles.countryOption} ${selectedCountry.iso === country.iso ? styles.selected : ''}`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className={styles.optionFlag}>{country.flag}</span>
                  <span className={styles.optionName}>
                    {locale === 'ar' ? country.nameAr : country.nameEn}
                  </span>
                  <span className={styles.optionCode}>{country.code}</span>
                </button>
              ))
            ) : (
              <div className={styles.noResults}>
                {locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
