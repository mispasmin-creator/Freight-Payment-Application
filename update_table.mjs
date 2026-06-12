import fs from 'fs';

let content = fs.readFileSync('src/components/FreightTable.tsx', 'utf-8');

// Colors
content = content.replace(/bg-slate-50\/80/g, 'bg-[#F1F5F9]');
content = content.replace(/border-slate-200/g, 'border-[#E2E8F0]');
content = content.replace(/border-slate-100/g, 'border-[#E2E8F0]');
content = content.replace(/text-slate-500/g, 'text-[#64748B]');
content = content.replace(/text-slate-600/g, 'text-[#64748B]');
content = content.replace(/text-slate-700/g, 'text-[#0F172A]');
content = content.replace(/text-slate-900/g, 'text-[#0F172A]');
content = content.replace(/bg-white/g, 'bg-[#FFFFFF]');

// Hover states
content = content.replace(/hover:bg-slate-50\/80/g, 'hover:bg-[#F1F5F9]');
content = content.replace(/hover:bg-slate-50\/50/g, 'hover:bg-[#F1F5F9] zebra-row');

// Typography and Spacing for Table
content = content.replace(/h-10 text-\[11px\]/g, 'h-12 px-4 text-[12px]');
content = content.replace(/text-\[11px\] font-bold/g, 'text-[12px] font-semibold');
content = content.replace(/text-sm/g, 'text-[13px]');
content = content.replace(/text-xs/g, 'text-[12px]');

// Padding
content = content.replace(/p-2/g, 'p-3');

// Sticky headers
content = content.replace(/<TableHeader>/, '<TableHeader className="sticky top-0 z-30 shadow-sm">');

fs.writeFileSync('src/components/FreightTable.tsx', content);
console.log('Done replacing styles.');
