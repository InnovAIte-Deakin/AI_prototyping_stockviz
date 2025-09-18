
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Search, Building2 } from 'lucide-react';
import { ASX_COMPANIES } from '@/data/asxCompanies';
import { BSE_COMPANIES } from '@/data/bseCompanies';
import { NSE_COMPANIES } from '@/data/nseCompanies';
import { NYSE_COMPANIES } from '@/data/nyseCompanies';
import { NASDAQ_COMPANIES } from '@/data/companies';
import { Company } from '@/data/companies';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompanySearchProps {
  onSelect: (company: Company) => void;
  placeholder?: string;
}

const ALL_COMPANIES = [
  ...NASDAQ_COMPANIES,
  ...ASX_COMPANIES,
  ...BSE_COMPANIES,
  ...NSE_COMPANIES,
  ...NYSE_COMPANIES
];

const CompanySearch = ({ onSelect, placeholder = "Search for a company..." }: CompanySearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const filteredCompanies = ALL_COMPANIES.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    setSuggestions(filteredCompanies);
  }, [searchTerm]);

  const handleSelect = (company: Company) => {
    setSearchTerm(company.name);
    setShowSuggestions(false);
    onSelect(company);
    toast({
      title: "Company Selected",
      description: `${company.name} (${company.exchange}:${company.symbol})`,
    });
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 w-full"
        />

        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200" 
            style={{ zIndex: 10001 }}
          >
            <ScrollArea className="h-[250px]">
              {suggestions.map((company, index) => (
                <div
                  key={`${company.exchange}-${company.symbol}-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => handleSelect(company)}
                >
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-black">{company.name}</div>
                    <div className="text-sm text-gray-600">
                      {company.exchange}:{company.symbol}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySearch;
