import { Component, computed, signal, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

const SCROLL_SENSITIVITY = 800;
const AUTO_ROTATE_SPEED = 0.08; // degrees per frame (~5°/sec at 60fps)
const IDLE_RESUME_DELAY = 2000; // ms before auto-rotation resumes after interaction

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  scrollProgress = signal(1);
  scrollRotation = signal(0);
  activeFace = signal(0);
  isAnimating = signal(false);

  private idleRotation = 0;
  private autoRotate = true;
  private animFrameId = 0;
  private idleTimerId: ReturnType<typeof setTimeout> | null = null;
  private animTimerId: ReturnType<typeof setTimeout> | null = null;

  cubeScale = computed(() => {
    const p = this.scrollProgress();
    return p < 1 ? 1 - 0.65 * p : 0.35;
  });

  cubeRotation = computed(() => {
    const base = this.activeFace() * -90;
    return this.scrollProgress() < 1 ? base : base + this.scrollRotation();
  });

  cubeTransform = computed(() => {
    const rotation = this.cubeRotation() + this.idleRotationSignal();
    return `scale(${this.cubeScale()}) rotateX(${rotation}deg)`;
  });

  idleRotationSignal = signal(0);

  isExpanded = computed(() => this.scrollProgress() === 0);

  @ViewChild('cubeEl') cubeEl!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.cubeEl.nativeElement.addEventListener('transitionend', (e: TransitionEvent) => {
      if (e.target === this.cubeEl.nativeElement && e.propertyName === 'transform') {
        this.clearAnimating();
      }
    });
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    if (this.idleTimerId) clearTimeout(this.idleTimerId);
    if (this.animTimerId) clearTimeout(this.animTimerId);
  }

  private clearAnimating(): void {
    this.isAnimating.set(false);
    if (this.animTimerId) {
      clearTimeout(this.animTimerId);
      this.animTimerId = null;
    }
  }

  private startAutoRotate(): void {
    const tick = () => {
      if (this.autoRotate && this.scrollProgress() >= 1 && !this.isAnimating()) {
        this.idleRotation += AUTO_ROTATE_SPEED;
        this.idleRotationSignal.set(this.idleRotation);
      }
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private pauseAutoRotate(): void {
    this.autoRotate = false;
    if (this.idleTimerId) clearTimeout(this.idleTimerId);
    this.idleTimerId = setTimeout(() => {
      this.autoRotate = true;
    }, IDLE_RESUME_DELAY);
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.isAnimating()) return;

    this.pauseAutoRotate();

    const delta = event.deltaY / SCROLL_SENSITIVITY;
    const current = this.scrollProgress();

    if (current < 1) {
      // Zooming phase: clamp between 0 and 1
      this.scrollProgress.set(Math.max(0, Math.min(1, current + delta)));
    } else {
      // Cube view: unbounded rotation in both directions
      this.scrollRotation.update(r => r + delta * 90);
    }
  }

  onFaceClick(faceIndex: number): void {
    if (this.scrollProgress() < 0.5 || this.isAnimating()) return;

    this.pauseAutoRotate();

    // Snap rotation instantly (no transition class yet)
    this.activeFace.set(faceIndex);
    this.idleRotation = 0;
    this.idleRotationSignal.set(0);
    this.scrollRotation.set(0);

    // Force reflow so rotation applies without animation
    void this.cubeEl.nativeElement.offsetHeight;

    // Now animate only the zoom
    this.isAnimating.set(true);
    this.scrollProgress.set(0);

    // Fallback in case transitionend doesn't fire
    if (this.animTimerId) clearTimeout(this.animTimerId);
    this.animTimerId = setTimeout(() => this.clearAnimating(), 700);
  }
}
