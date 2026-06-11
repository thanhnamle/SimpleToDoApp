import { Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';
import { AudioService } from '../services/audio.service';

@Directive({
  selector: '[appRipple]',
  standalone: true
})
export class RippleDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private audioService = inject(AudioService);

  @HostListener('mousedown', ['$event'])
  onClick(event: MouseEvent) {
    this.audioService.playClick();
    
    const rect = this.el.nativeElement.getBoundingClientRect();
    
    // Ensure host is relative and hidden overflow
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');

    const ripple = this.renderer.createElement('span');
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    this.renderer.setStyle(ripple, 'width', `${diameter}px`);
    this.renderer.setStyle(ripple, 'height', `${diameter}px`);
    this.renderer.setStyle(ripple, 'left', `${event.clientX - rect.left - radius}px`);
    this.renderer.setStyle(ripple, 'top', `${event.clientY - rect.top - radius}px`);
    
    this.renderer.addClass(ripple, 'ripple');

    this.renderer.appendChild(this.el.nativeElement, ripple);

    // Remove ripple after animation completes (600ms)
    setTimeout(() => {
      this.renderer.removeChild(this.el.nativeElement, ripple);
    }, 600);
  }
}
