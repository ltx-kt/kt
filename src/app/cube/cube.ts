import { Component, computed, signal, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Home } from '../faces/home/home';
import { About } from '../faces/about/about';
import { Projects } from '../faces/projects/projects';
import { Contact } from '../faces/contact/contact';

const SCROLL_SENSITIVITY = 800;
const AUTO_ROTATE_SPEED = 0.08; // degrees per frame (~5°/sec at 60fps)
const IDLE_RESUME_DELAY = 2000; // ms before auto-rotation resumes after interaction

@Component({
  selector: 'app-cube',
  imports: [Home, About, Projects, Contact],
  templateUrl: './cube.html',
  styleUrl: './cube.scss',
})
export class Cube implements AfterViewInit, OnDestroy {
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
    if (p >= 1) return 0.35;
    // Compensate for perspective magnification from translateZ(50vh)
    const translateZ = window.innerHeight * 0.5;
    const fitScale = (1500 - translateZ) / 1500;
    return fitScale + (0.35 - fitScale) * p;
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

    // Snap to the nearest face so we zoom into a full page, not a split
    const totalRotation = this.activeFace() * -90 + this.scrollRotation() + this.idleRotation;
    const nearestFace = Math.round(-totalRotation / 90);
    this.activeFace.set(nearestFace);
    this.scrollRotation.set(0);
    this.idleRotation = 0;
    this.idleRotationSignal.set(0);

    // Animate snap + zoom together
    this.isAnimating.set(true);
    this.scrollProgress.set(0);

    // Fallback in case transitionend doesn't fire
    if (this.animTimerId) clearTimeout(this.animTimerId);
    this.animTimerId = setTimeout(() => this.clearAnimating(), 700);
  }
}
