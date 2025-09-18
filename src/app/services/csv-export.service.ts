import { Injectable } from '@angular/core';
import { Entry } from '../types/entries.types';

@Injectable({
  providedIn: 'root'
})
export class CsvExportService {

  public exportEntriesToCsv(entries: Entry[], filename: string = 'entry-log-export.csv'): void {
    if (!entries || entries.length === 0) {
      console.warn('No entries to export');
      return;
    }

    const csvContent = this.generateCsvContent(entries);
    this.downloadCsv(csvContent, filename);
  }

  private generateCsvContent(entries: Entry[]): string {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Title',
      'Notes',
      'Soil Temperature',
      'Soil Temperature Unit',
      'Activities',
      'Lawn Segments',
      'Products',
      'Product Quantities',
      'Images Count'
    ];

    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const row = [
        entry.id.toString(),
        this.escapeCsvField(entry.date),
        this.escapeCsvField(entry.time),
        this.escapeCsvField(entry.title),
        this.escapeCsvField(entry.notes),
        entry.soilTemperature?.toString() || '',
        this.escapeCsvField(entry.soilTemperatureUnit),
        this.escapeCsvField(this.formatActivities(entry.activities)),
        this.escapeCsvField(this.formatLawnSegments(entry.lawnSegments)),
        this.escapeCsvField(this.formatProducts(entry.products)),
        this.escapeCsvField(this.formatProductQuantities(entry.products)),
        entry.images?.length?.toString() || '0'
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private formatActivities(activities: any[]): string {
    if (!activities || activities.length === 0) return '';
    return activities.map(activity => activity.name || activity.title || activity.id).join('; ');
  }

  private formatLawnSegments(segments: any[]): string {
    if (!segments || segments.length === 0) return '';
    return segments.map(segment => segment.name || segment.title || segment.id).join('; ');
  }

  private formatProducts(products: any[]): string {
    if (!products || products.length === 0) return '';
    return products.map(product => {
      const brand = product.brand ? `${product.brand} ` : '';
      return `${brand}${product.name}`;
    }).join('; ');
  }

  private formatProductQuantities(products: any[]): string {
    if (!products || products.length === 0) return '';
    return products.map(product =>
      `${product.quantity} ${product.quantityUnit}`
    ).join('; ');
  }

  private escapeCsvField(field: string | undefined | null): string {
    if (!field) return '';

    const stringField = field.toString();

    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }

    return stringField;
  }

  private downloadCsv(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  public exportEntriesInDateRange(
    entries: Entry[],
    startDate: Date,
    endDate: Date,
    filename?: string
  ): void {
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const dateRangeFilename = filename ||
      `entry-log-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;

    this.exportEntriesToCsv(filteredEntries, dateRangeFilename);
  }
}