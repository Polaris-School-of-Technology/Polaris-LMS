import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface MultiSelectProps {
    options: Option[];
    value: (string | number)[];
    onChange: (value: (string | number)[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select options',
    disabled = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside both the trigger button (containerRef) and the dropdown portal (dropdownRef)
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        const handleScroll = () => {
            if (isOpen) {
                // Optional: Close on scroll or update position. Closing is simpler/safer for now.
                // setIsOpen(false); 
                updatePosition();
            }
        };

        const handleResize = () => {
            if (isOpen) {
                updatePosition();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // Capture scroll events from any parent
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            // Default to down, but if space below is tight (< 240px) and space above is slightly better, go up.
            // Or if the user strictly implied "up", we could force it.
            // Given the image shows it covering buttons, "down" with Portal is likely what fits the image.
            // But we will respect "space below" logic to ensure it's visible.

            const shouldGoUp = spaceBelow < 250 && spaceAbove > spaceBelow;

            setDropdownStyle({
                position: 'fixed',
                left: `${rect.left}px`,
                top: shouldGoUp ? 'auto' : `${rect.bottom + 8}px`,
                bottom: shouldGoUp ? `${viewportHeight - rect.top + 8}px` : 'auto',
                width: `${rect.width}px`,
                zIndex: 9999, // High z-index to break out of modals
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            // Focus search after a short delay to allow render
            setTimeout(() => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (optionValue: string | number) => {
        const newValue = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleRemove = (e: React.MouseEvent, optionValue: string | number) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== optionValue));
    };

    const getBadges = () => {
        if (value.length === 0) return <span className="text-gray-400">{placeholder}</span>;

        // Show first 2 items + count
        const displayCount = 2;
        const selectedOptions = options.filter(opt => value.includes(opt.value));
        const firstFew = selectedOptions.slice(0, displayCount);
        const remainingCount = value.length - displayCount;

        return (
            <div className="flex flex-wrap gap-1 items-center">
                {firstFew.map(opt => (
                    <span key={opt.value} className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        {opt.label}
                        <button
                            onClick={(e) => handleRemove(e, opt.value)}
                            className="hover:text-white"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
                {remainingCount > 0 && (
                    <span className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs">
                        +{remainingCount} more
                    </span>
                )}
            </div>
        );
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-fade-in text-left flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Search Input */}
            <div className="p-2 border-b border-gray-700 bg-gray-800 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault(); // Prevent form submission
                            }
                        }}
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-yellow-500"
                    />
                </div>
            </div>

            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                        const isSelected = value.includes(option.value);
                        return (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-gray-700/30' : ''
                                    }`}
                            >
                                <span className={`text-sm ${isSelected ? 'text-yellow-500 font-medium' : 'text-gray-300'}`}>
                                    {option.label}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-yellow-500" />}
                            </div>
                        );
                    })
                ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No results found
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full h-12 px-4 bg-gray-800 border ${isOpen ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-gray-700'
                    } text-white rounded-lg flex items-center justify-between transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                disabled={disabled}
            >
                <div className="flex-1 overflow-hidden text-left">
                    {getBadges()}
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(dropdownContent, document.body)}
        </div>
    );
};

export default MultiSelect;
