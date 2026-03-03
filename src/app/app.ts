import { Component, computed, signal, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

const SCROLL_SENSITIVITY = 800;
const MAX_SCROLL = 5.0;

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit {
  scrollProgress = signal(1);
  activeFace = signal(0);
  isAnimating = signal(false);

  cubeScale = computed(() => {
    const p = this.scrollProgress();
    return p < 1 ? 1 - 0.65 * p : 0.35;
  });

  cubeRotation = computed(() => {
    const p = this.scrollProgress();
    const base = this.activeFace() * -90;
    return p < 1 ? base : base - (p - 1) * 90;
  });

  cubeTransform = computed(() =>
    `scale(${this.cubeScale()}) rotateX(${this.cubeRotation()}deg)`
  );

  isExpanded = computed(() => this.scrollProgress() === 0);

  @ViewChild('cubeEl') cubeEl!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.cubeEl.nativeElement.addEventListener('transitionend', () => {
      this.isAnimating.set(false);
    });
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.isAnimating()) return;

    const delta = event.deltaY / SCROLL_SENSITIVITY;
    const current = this.scrollProgress();
    const minScroll = current >= 1 ? 1 : 0;
    const newProgress = Math.max(minScroll, Math.min(MAX_SCROLL, current + delta));
    this.scrollProgress.set(newProgress);
  }

  onFaceClick(faceIndex: number): void {
    if (this.scrollProgress() < 0.5 || this.isAnimating()) return;

    this.isAnimating.set(true);
    this.activeFace.set(faceIndex);
    this.scrollProgress.set(0);
  }
}
