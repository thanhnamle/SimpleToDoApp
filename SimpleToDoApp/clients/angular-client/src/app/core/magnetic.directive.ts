import { Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';
import { AudioService } from '../services/audio.service';

@Directive({
  selector: '[appMagnetic]',
  standalone: true
})
export class MagneticDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private audioService = inject(AudioService);

  @HostListener('mouseenter')
  onMouseEnter() {
    this.audioService.playHover();
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.1s ease-out');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    // Move element slightly towards the mouse
    this.renderer.setStyle(this.el.nativeElement, 'transform', `translate(${x * 0.2}px, ${y * 0.2}px)`);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translate(0px, 0px)');
  }
}
