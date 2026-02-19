import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    searchPlaceholder = "Buscar...",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = value || '';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:border-orange-500/50 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
            >
                <span className="truncate">{selectedOption || placeholder}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-slate-50 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            autoFocus
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-0 placeholder:text-slate-300"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-[300px] overflow-y-auto p-2">
                        {filteredOptions.length > 0 ? (
                            <>
                                <button
                                    onClick={() => {
                                        onChange('');
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${!value ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {placeholder}
                                </button>
                                {filteredOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${value === opt ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600 pl-3' : 'text-slate-700 hover:bg-purple-50 hover:text-purple-600'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <div className="px-4 py-10 text-center text-slate-400 text-sm italic">
                                Nenhuma opção encontrada
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
