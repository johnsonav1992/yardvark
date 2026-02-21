import { Injectable } from "@angular/core";
import type { CsvExportConfig } from "../types/csv.types";

@Injectable({
	providedIn: "root",
})
export class CsvExportService {
	public exportToCsv<T>(data: T[], config: CsvExportConfig<T>): void {
		if (!data || data.length === 0) {
			console.warn("No data to export");
			return;
		}

		const csvContent = this.generateCsvContent(data, config);
		this.downloadCsv(csvContent, config.filename || "export.csv");
	}

	private generateCsvContent<T>(data: T[], config: CsvExportConfig<T>): string {
		const csvRows = [config.headers.join(",")];

		data.forEach((item) => {
			const row = config
				.rowMapper(item)
				.map((field) => this.escapeCsvField(field));
			csvRows.push(row.join(","));
		});

		return csvRows.join("\n");
	}

	private escapeCsvField(field: string | number | undefined | null): string {
		if (field === null || field === undefined) return "";

		let stringField = field.toString();

		stringField = this.normalizeUtf8ToAscii(stringField);

		if (
			stringField.includes(",") ||
			stringField.includes('"') ||
			stringField.includes("\n")
		) {
			return `"${stringField.replace(/"/g, '""')}"`;
		}

		return stringField;
	}

	private normalizeUtf8ToAscii(text: string): string {
		const replacements: { [key: string]: string } = {
			"\u201C": '"',
			"\u201D": '"',
			"\u2018": "'",
			"\u2019": "'",
			"\u2013": "-",
			"\u2014": "--",
			"\u2026": "...",
			"\u00A0": " ",
			"\u00B0": " degrees",
			"\u2032": "'",
			"\u2033": '"',
		};

		let normalized = text;

		for (const [utf8Char, asciiChar] of Object.entries(replacements)) {
			normalized = normalized.replace(new RegExp(utf8Char, "g"), asciiChar);
		}

		return normalized;
	}

	private downloadCsv(csvContent: string, filename: string): void {
		const BOM = "\uFEFF";
		const csvWithBom = BOM + csvContent;

		const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");

		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);

			link.setAttribute("href", url);
			link.setAttribute("download", filename);
			link.style.visibility = "hidden";

			document.body.appendChild(link);

			link.click();

			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}
	}
}
