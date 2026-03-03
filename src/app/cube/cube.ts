import { Component, computed, signal, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Home } from '../faces/home/home';
import { About } from '../faces/about/about';
import { Projects } from '../faces/projects/projects';
import { Contact } from '../faces/contact/contact';
import { Placeholder } from '../faces/placeholder/placeholder';

const DRAG_SENSITIVITY = 300; // pixels per 90° of rotation
const DRAG_MOVE_THRESHOLD = 5; // pixels before a drag suppresses click
const AUTO_ROTATE_SPEED = 0.08; // degrees per frame (~5°/sec at 60fps)
const IDLE_RESUME_DELAY = 2000; // ms before auto-rotation resumes after interaction

@Component({
  selector: 'app-cube',
  imports: [Home, About, Projects, Contact, Placeholder],
  templateUrl: './cube.html',
  styleUrl: './cube.scss',
})
export class Cube implements AfterViewInit, OnDestroy {
  scrollProgress = signal(1);
  scrollRotation = signal(0);
  scrollRotationY = signal(0);
  activeFace = signal(0);
  isAnimating = signal(false);

  private idleRotation = 0;
  private autoRotate = true;
  private animFrameId = 0;
  private idleTimerId: ReturnType<typeof setTimeout> | null = null;
  private animTimerId: ReturnType<typeof setTimeout> | null = null;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartRotation = 0;
  private dragStartRotationY = 0;
  private dragStartProgress = 0;
  private dragMoved = false;

  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);

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

  cubeRotationY = computed(() => {
    return this.scrollProgress() < 1 ? 0 : this.scrollRotationY();
  });

  cubeTransform = computed(() => {
    const rotationX = this.cubeRotation() + this.idleRotationSignal();
    const rotationY = this.cubeRotationY();
    return `scale(${this.cubeScale()}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
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
    document.removeEventListener('pointermove', this.onPointerMoveBound);
    document.removeEventListener('pointerup', this.onPointerUpBound);
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

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (this.isAnimating()) return;

    this.isDragging = true;
    this.dragMoved = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartRotation = this.scrollRotation();
    this.dragStartRotationY = this.scrollRotationY();
    this.dragStartProgress = this.scrollProgress();

    this.pauseAutoRotate();
    (event.target as Element)?.setPointerCapture?.(event.pointerId);
    document.addEventListener('pointermove', this.onPointerMoveBound);
    document.addEventListener('pointerup', this.onPointerUpBound);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;

    if (Math.abs(deltaX) > DRAG_MOVE_THRESHOLD || Math.abs(deltaY) > DRAG_MOVE_THRESHOLD) {
      this.dragMoved = true;
    }

    if (this.dragStartProgress < 1) {
      const progressDelta = deltaY / DRAG_SENSITIVITY;
      this.scrollProgress.set(Math.max(0, Math.min(1, this.dragStartProgress + progressDelta)));
    } else {
      this.scrollRotation.set(this.dragStartRotation + (-deltaY / DRAG_SENSITIVITY) * 90);
      this.scrollRotationY.set(this.dragStartRotationY + (deltaX / DRAG_SENSITIVITY) * 90);
    }
  }

  private onPointerUp(event: PointerEvent): void {
    this.isDragging = false;
    (event.target as Element)?.releasePointerCapture?.(event.pointerId);
    document.removeEventListener('pointermove', this.onPointerMoveBound);
    document.removeEventListener('pointerup', this.onPointerUpBound);
  }

  zoomOut(): void {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    this.scrollProgress.set(1);

    if (this.animTimerId) clearTimeout(this.animTimerId);
    this.animTimerId = setTimeout(() => this.clearAnimating(), 700);
  }

  onFaceClick(faceIndex: number): void {
    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }
    if (this.scrollProgress() < 0.5 || this.isAnimating()) return;

    this.pauseAutoRotate();

    // Zoom into the clicked face
    this.activeFace.set(faceIndex);
    this.scrollRotation.set(0);
    this.idleRotation = 0;
    this.idleRotationSignal.set(0);
    this.scrollRotationY.set(0);

    // Animate snap + zoom together
    this.isAnimating.set(true);
    this.scrollProgress.set(0);

    // Fallback in case transitionend doesn't fire
    if (this.animTimerId) clearTimeout(this.animTimerId);
    this.animTimerId = setTimeout(() => this.clearAnimating(), 700);
  }
}
