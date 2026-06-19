const fs = require("fs");
const path = "d:/Coding/Computer Science/Personal Project/Testing/SimpleToDoApp/SimpleToDoApp/clients/angular-client/src/app/todo-modal/todo-modal.html";
let content = fs.readFileSync(path, "utf8");

// Set up layout wrapper
content = content.replace(
  '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">\r\n    <!-- Overlay backdrop -->\r\n    <div (click)="onClose()" class="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"></div>\r\n\r\n    <!-- Modal body -->\r\n    <div class="z-10 w-full max-w-lg overflow-y-auto scrollbar-hide max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-scale-up">',
  '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in pointer-events-none">\r\n    <!-- Overlay backdrop -->\r\n    <div (click)="onClose()" class="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity pointer-events-auto"></div>\r\n\r\n    <!-- Layout Wrapper -->\r\n    <div class="flex items-start justify-center gap-6 w-full max-w-5xl pointer-events-none animate-scale-up mt-[2vh] md:mt-[6vh]">\r\n      <!-- Modal body -->\r\n      <div class="pointer-events-auto z-10 w-full max-w-lg overflow-y-auto scrollbar-hide max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shrink-0">'
);

// Fallback for LF
content = content.replace(
  '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">\n    <!-- Overlay backdrop -->\n    <div (click)="onClose()" class="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"></div>\n\n    <!-- Modal body -->\n    <div class="z-10 w-full max-w-lg overflow-y-auto scrollbar-hide max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-scale-up">',
  '<div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in pointer-events-none">\n    <!-- Overlay backdrop -->\n    <div (click)="onClose()" class="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity pointer-events-auto"></div>\n\n    <!-- Layout Wrapper -->\n    <div class="flex items-start justify-center gap-6 w-full max-w-5xl pointer-events-none animate-scale-up mt-[2vh] md:mt-[6vh]">\n      <!-- Modal body -->\n      <div class="pointer-events-auto z-10 w-full max-w-lg overflow-y-auto scrollbar-hide max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shrink-0">'
);

// Extract start picker
const startPickerStart = '            <!-- Custom Start Date Picker Dropdown -->';
const startStartIdx = content.indexOf(startPickerStart);
const startFooterIdx = content.indexOf('<!-- Footer Action to close picker -->', startStartIdx);
const startEndIdx = content.indexOf('            }', startFooterIdx) + 13;
const startPickerHtml = content.substring(startStartIdx, startEndIdx);
content = content.substring(0, startStartIdx) + content.substring(startEndIdx);

// Extract due picker
const duePickerStart = '            <!-- Custom Due Date Picker Dropdown -->';
const dueStartIdx = content.indexOf(duePickerStart);
const dueFooterIdx = content.indexOf('<!-- Footer Action to close picker -->', dueStartIdx);
const dueEndIdx = content.indexOf('            }', dueFooterIdx) + 13;
const duePickerHtml = content.substring(dueStartIdx, dueEndIdx);
content = content.substring(0, dueStartIdx) + content.substring(dueEndIdx);

const sidePanel = `
    <!-- Side Picker (Slides from Right on Desktop, overlaps on Mobile) -->
    @if (showStartPicker || showDuePicker) {
      <div class="pointer-events-auto fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[340px] max-w-[90vw] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-5 animate-scale-up lg:static lg:transform-none lg:z-50 lg:animate-slide-in-right shrink-0">
${startPickerHtml.replace(/<div class="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4">/g, '<div class="w-full">').replace(/            /g, '        ')}
${duePickerHtml.replace(/<div class="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4">/g, '<div class="w-full">').replace(/            /g, '        ')}
      </div>
    }
`;

content = content.replace("    </div>\r\n  </div>\r\n}", "    </div>\r\n" + sidePanel + "  </div>\r\n}");
content = content.replace("    </div>\n  </div>\n}", "    </div>\n" + sidePanel + "  </div>\n}");

fs.writeFileSync(path, content, "utf8");
console.log("Successfully updated todo-modal.html safely.");
