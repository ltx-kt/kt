import { Component, computed, signal, output, effect, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Home } from '../faces/home/home';
import { About } from '../faces/about/about';
import { Projects } from '../faces/projects/projects';
import { Contact } from '../faces/contact/contact';
import { Placeholder } from '../faces/placeholder/placeholder';

const DRAG_SENSITIVITY = 300; // pixels per 90° of rotation
const DRAG_MOVE_THRESHOLD = 5; // pixels before a drag suppresses click
const AUTO_ROTATE_SPEED = 0.08; // degrees per frame (~5°/sec at 60fps)
const IDLE_RESUME_DELAY = 2000; // ms before auto-rotation resumes after interaction
const MOMENTUM_FRICTION = 0.96; // per-frame decay (normalized to 60fps)
const MOMENTUM_STOP_THRESHOLD = 0.5; // deg/s below which momentum stops
const VELOCITY_SAMPLE_WINDOW = 100; // ms window for velocity calculation

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
  private dragFlipX = 1;  // sign correction for vertical drag → X rotation
  private dragFlipY = 1;  // sign correction for horizontal drag → Y rotation

  private pointerHistory: { x: number; y: number; time: number }[] = [];
  private momentumVelocityX = 0; // deg/s
  private momentumVelocityY = 0; // deg/s
  private momentumLastTime = 0;

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
  expandedChange = output<boolean>();

  constructor() {
    effect(() => this.expandedChange.emit(this.isExpanded()));
  }

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
    const tick = (timestamp: number) => {
      // Momentum phase
      if (this.momentumLastTime > 0 && (this.momentumVelocityX !== 0 || this.momentumVelocityY !== 0)) {
        const dt = (timestamp - this.momentumLastTime) / 1000; // seconds
        this.momentumLastTime = timestamp;

        this.scrollRotation.update(r => r + this.momentumVelocityX * dt);
        this.scrollRotationY.update(r => r + this.momentumVelocityY * dt);

        const decay = Math.pow(MOMENTUM_FRICTION, dt * 60);
        this.momentumVelocityX *= decay;
        this.momentumVelocityY *= decay;

        const speed = Math.sqrt(this.momentumVelocityX ** 2 + this.momentumVelocityY ** 2);
        if (speed < MOMENTUM_STOP_THRESHOLD) {
          this.momentumVelocityX = 0;
          this.momentumVelocityY = 0;
          this.momentumLastTime = 0;
          this.pauseAutoRotate();
        }
      } else if (this.autoRotate && this.scrollProgress() >= 1 && !this.isAnimating()) {
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
    if (this.isExpanded()) return;

    this.momentumVelocityX = 0;
    this.momentumVelocityY = 0;
    this.momentumLastTime = 0;
    this.pointerHistory = [];

    this.isDragging = true;
    this.dragMoved = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartRotation = this.scrollRotation();
    this.dragStartRotationY = this.scrollRotationY();
    this.dragStartProgress = this.scrollProgress();

    const totalX = this.activeFace() * -90 + this.dragStartRotation + this.idleRotation;
    const totalY = this.dragStartRotationY;
    this.dragFlipX = Math.cos(totalY * Math.PI / 180) >= 0 ? 1 : -1;
    this.dragFlipY = Math.cos(totalX * Math.PI / 180) >= 0 ? 1 : -1;

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
      this.scrollRotation.set(this.dragStartRotation + (-deltaY / DRAG_SENSITIVITY) * 90 * this.dragFlipX);
      this.scrollRotationY.set(this.dragStartRotationY + (deltaX / DRAG_SENSITIVITY) * 90 * this.dragFlipY);

      const now = performance.now();
      this.pointerHistory.push({ x: event.clientX, y: event.clientY, time: now });
      const cutoff = now - VELOCITY_SAMPLE_WINDOW;
      while (this.pointerHistory.length > 0 && this.pointerHistory[0].time < cutoff) {
        this.pointerHistory.shift();
      }
    }
  }

  private onPointerUp(event: PointerEvent): void {
    const wasDraggingCube = this.dragStartProgress >= 1;
    this.isDragging = false;
    (event.target as Element)?.releasePointerCapture?.(event.pointerId);
    document.removeEventListener('pointermove', this.onPointerMoveBound);
    document.removeEventListener('pointerup', this.onPointerUpBound);

    if (wasDraggingCube) {
      this.applyMomentum();
    }
  }

  private applyMomentum(): void {
    if (this.pointerHistory.length < 2) return;

    const oldest = this.pointerHistory[0];
    const newest = this.pointerHistory[this.pointerHistory.length - 1];
    const dt = (newest.time - oldest.time) / 1000; // seconds
    if (dt <= 0) return;

    const dxPx = newest.x - oldest.x;
    const dyPx = newest.y - oldest.y;

    // Convert pixel velocity to deg/s using the same scaling as onPointerMove
    this.momentumVelocityX = (-dyPx / DRAG_SENSITIVITY) * 90 / dt * this.dragFlipX;
    this.momentumVelocityY = (dxPx / DRAG_SENSITIVITY) * 90 / dt * this.dragFlipY;

    const speed = Math.sqrt(this.momentumVelocityX ** 2 + this.momentumVelocityY ** 2);
    if (speed > MOMENTUM_STOP_THRESHOLD) {
      this.momentumLastTime = performance.now();
    } else {
      this.momentumVelocityX = 0;
      this.momentumVelocityY = 0;
    }
  }

  zoomOut(): void {
    if (this.isAnimating()) return;

    this.isAnimating.set(true);
    this.scrollProgress.set(1);

    if (this.animTimerId) clearTimeout(this.animTimerId);
    this.animTimerId = setTimeout(() => this.clearAnimating(), 700);
  }

  onFaceClick(faceIndex: number): void {
    if (this.dragMoved) { this.dragMoved = false; return; }
    if (this.scrollProgress() < 0.5 || this.isAnimating()) return;

    // Stop momentum & auto-rotate
    this.momentumVelocityX = 0;
    this.momentumVelocityY = 0;
    this.momentumLastTime = 0;
    this.pauseAutoRotate();

    // Calculate current total rotation from all sources
    const currentTotalX = this.activeFace() * -90 + this.scrollRotation() + this.idleRotation;
    const targetX = faceIndex * -90;

    // Shortest-path delta normalized to [-180, 180]
    const deltaX = ((currentTotalX - targetX) % 360 + 540) % 360 - 180;
    const deltaY = ((this.scrollRotationY() % 360) + 540) % 360 - 180;

    // Fold delta into scrollRotation (no visual change yet)
    this.activeFace.set(faceIndex);
    this.scrollRotation.set(deltaX);
    this.idleRotation = 0;
    this.idleRotationSignal.set(0);
    this.scrollRotationY.set(deltaY);

    // Next frame: enable transition and animate spin + zoom together
    requestAnimationFrame(() => {
      this.isAnimating.set(true);
      this.scrollRotation.set(0);
      this.scrollRotationY.set(0);
      this.scrollProgress.set(0);

      if (this.animTimerId) clearTimeout(this.animTimerId);
      this.animTimerId = setTimeout(() => this.clearAnimating(), 700);
    });
  }
}
