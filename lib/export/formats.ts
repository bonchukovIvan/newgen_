export const exportFormats=['node','static','php'] as const;
export type ExportFormat=typeof exportFormats[number];
export function isExportFormat(value:string):value is ExportFormat{return exportFormats.some(format=>format===value);}
