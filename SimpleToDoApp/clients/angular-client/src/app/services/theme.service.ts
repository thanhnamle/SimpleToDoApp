import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<'light' | 'dark'>('light'); // Default to light professional theme

  constructor() {
    // Read preference on startup
    const saved = localStorage.getItem('theme') as 'light' | 'dark';
    if (saved) {
      this.theme.set(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }

    // Effect to apply classes reactively to document element
    effect(() => {
      const current = this.theme();
      localStorage.setItem('theme', current);
      const root = document.documentElement;
      if (current === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  isDark() {
    return this.theme() === 'dark';
  }
}
