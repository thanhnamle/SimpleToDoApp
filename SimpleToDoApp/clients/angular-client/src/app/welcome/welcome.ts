import { Component, inject, OnInit, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { ScrollRevealDirective } from '../core/scroll-reveal.directive';
import {
  LucideSun,
  LucideMoon,
  LucideCalendar,
  LucideCheckCircle2,
  LucideListTodo,
  LucideCheckSquare,
  LucideArrowRight,
  LucideZap,
  LucideKanban,
  LucideUsers,
  LucideMenu,
  LucideX,
  LucideStar,
  LucideQuote,
  LucideCheck,
  LucideArrowUp
} from '@lucide/angular';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    RouterLink,
    ScrollRevealDirective,
    LucideSun,
    LucideMoon,
    LucideCalendar,
    LucideCheckCircle2,
    LucideListTodo,
    LucideCheckSquare,
    LucideArrowRight,
    LucideZap,
    LucideKanban,
    LucideUsers,
    LucideMenu,
    LucideX,
    LucideStar,
    LucideQuote,
    LucideCheck,
    LucideArrowUp
  ],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);

  isLoggedIn = false;
  isMobileMenuOpen = false;
  showScrollUpButton = false;

  testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Project Manager',
      company: 'TechFlow',
      content: 'ZenTodo completely transformed how our engineering team tracks daily sprints. The magnetic UI feels like magic!',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah'
    },
    {
      name: 'Michael Chen',
      role: 'Department Head',
      company: 'Acme Corp',
      content: 'Finally, a tool that balances playful aesthetics with serious department-level task management. Highly recommended.',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Michael'
    },
    {
      name: 'Emily Davis',
      role: 'Freelancer',
      company: 'DesignStudio',
      content: 'The 3D interactions and gamification confetti make checking off tasks genuinely addictive. I get so much more done.',
      avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Emily'
    }
  ];

  ngOnInit() {
    this.isLoggedIn = !!this.authService.currentToken();
  }

  get isDark() {
    return this.themeService.isDark();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Show button when scrolled down 300px
    this.showScrollUpButton = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
