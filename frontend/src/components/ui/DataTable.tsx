import React, { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  searchPlaceholder = 'Search...', 
  searchKeys, 
  onRowClick,
  emptyState
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (search && searchKeys && searchKeys.length > 0) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(item => 
        searchKeys.some(key => {
          const val = item[key];
          return val != null && String(val).toLowerCase().includes(lowerSearch);
        })
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, searchKeys, sortConfig]);

  return (
    <div className={styles.container}>
      {/* Controls */}
      <div className={styles.controls}>
        {searchKeys && searchKeys.length > 0 && (
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className={col.sortable ? styles.sortable : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={styles.thContent}>
                    {col.header}
                    {col.sortable && (
                      <span className={`${styles.sortIcon} ${sortConfig?.key === col.key ? styles.active : ''}`}>
                        {sortConfig?.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.length > 0 ? (
              processedData.map((row, idx) => (
                <tr 
                  key={row.id || idx} 
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? styles.clickableRow : ''}
                >
                  {columns.map(col => (
                    <td key={`${row.id || idx}-${col.key}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  {emptyState || (
                    <>
                      <div className={styles.emptyIcon}>📭</div>
                      <p>No data found</p>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
