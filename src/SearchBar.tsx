// SearchBar.tsx
import React from 'react';
import { Input } from 'antd';

interface SearchBarProps {
    onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchTerm: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchTerm }) => {
    return (
        <Input
            placeholder="Search by Name"
            value={searchTerm}
            onChange={onSearch}
            style={{ marginBottom: '20px', width: '300px', marginTop: '20px' }}
        />
    );
};

export default SearchBar;
