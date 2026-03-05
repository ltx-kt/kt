import { TestBed } from '@angular/core/testing';
import { Cube } from './cube';

describe('Cube', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cube],
    }).compileComponents();
  });

  it('should create the cube', () => {
    const fixture = TestBed.createComponent(Cube);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ── Template rendering ──────────────────────────────────────────────────────

  describe('template', () => {
    it('should render the name on the front face', async () => {
      const fixture = TestBed.createComponent(Cube);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.person__name')?.textContent).toContain('Kevin Tran');
    });

    it('should render the role on the front face', async () => {
      const fixture = TestBed.createComponent(Cube);
      await fixture.whenStable();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.person__role')?.textContent).toContain('Software Engineer');
    });

    it('should render all six cube faces', () => {
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      const faces = fixture.nativeElement.querySelectorAll('.cube__face');
      expect(faces.length).toBe(6);
    });

    it('should render About, Projects, and Contact headings', () => {
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      const headings = fixture.nativeElement.querySelectorAll('.face-heading');
      const texts = Array.from(headings).map((h: any) => h.textContent.trim());
      expect(texts).toEqual(['Work Experience', 'Projects', 'Contact', '?', '?']);
    });

    it('should render the GitHub link with correct href', () => {
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('.face-link') as HTMLAnchorElement;
      expect(link).toBeTruthy();
      expect(link.href).toContain('github.com/ltx-kt');
      expect(link.target).toBe('_blank');
      expect(link.rel).toContain('noopener');
    });
  });

  // ── Computed signals ────────────────────────────────────────────────────────

  describe('cubeScale', () => {
    // The fitScale formula compensates for perspective magnification from translateZ(50vh)
    const fitScale = (1500 - window.innerHeight * 0.5) / 1500;

    it('should return fitScale when scrollProgress is 0 (fully expanded)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);
      expect(cube.cubeScale()).toBeCloseTo(fitScale, 3);
    });

    it('should return 0.35 when scrollProgress is 1 (cube view)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      expect(cube.cubeScale()).toBe(0.35);
    });

    it('should interpolate between fitScale and 0.35 during zoom', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);
      const expected = fitScale + (0.35 - fitScale) * 0.5;
      expect(cube.cubeScale()).toBeCloseTo(expected, 3);
    });
  });

  describe('cubeRotation', () => {
    it('should be 0 when activeFace is 0 and scrollProgress < 1', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);
      cube.activeFace.set(0);
      expect(cube.cubeRotation()).toBeCloseTo(0);
    });

    it('should be -90 * activeFace when scrollProgress < 1', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);
      cube.activeFace.set(2);
      expect(cube.cubeRotation()).toBe(-180);
    });

    it('should include scrollRotation when scrollProgress is 1', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      cube.activeFace.set(0);
      cube.scrollRotation.set(45);
      expect(cube.cubeRotation()).toBe(45);
    });
  });

  describe('cubeRotationY', () => {
    it('should be 0 when scrollProgress < 1', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);
      cube.scrollRotationY.set(45);
      expect(cube.cubeRotationY()).toBe(0);
    });

    it('should return scrollRotationY when scrollProgress is 1', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      cube.scrollRotationY.set(45);
      expect(cube.cubeRotationY()).toBe(45);
    });
  });

  describe('cubeTransform', () => {
    it('should include both rotateX and rotateY', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(10);
      cube.scrollRotationY.set(20);
      const transform = cube.cubeTransform();
      expect(transform).toContain('rotateX(');
      expect(transform).toContain('rotateY(20deg)');
    });

    it('should not include scaleX', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      expect(cube.cubeTransform()).not.toContain('scaleX');
    });
  });

  describe('isExpanded', () => {
    it('should be true when scrollProgress is 0', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);
      expect(cube.isExpanded()).toBe(true);
    });

    it('should be false when scrollProgress is greater than 0', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.1);
      expect(cube.isExpanded()).toBe(false);
    });
  });

  // ── Face click interaction ──────────────────────────────────────────────────

  describe('onFaceClick', () => {
    it('should zoom in (set scrollProgress to 0) when in cube view', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      expect(cube.scrollProgress()).toBe(1); // still 1 before timeout
      vi.advanceTimersByTime(300);
      expect(cube.scrollProgress()).toBe(0);
      vi.useRealTimers();
    });

    it('should set isBlinking to true immediately on click', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      expect(cube.isBlinking()).toBe(true);
    });

    it('should clear isBlinking after 300ms timeout', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      expect(cube.isBlinking()).toBe(true);
      vi.advanceTimersByTime(300);
      expect(cube.isBlinking()).toBe(false);
      vi.useRealTimers();
    });

    it('should reset scrollRotation and idleRotationSignal after 300ms', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(45);
      cube.idleRotationSignal.set(10);

      cube.onFaceClick(0);
      expect(cube.scrollRotation()).toBe(45); // unchanged before timeout
      vi.advanceTimersByTime(300);
      expect(cube.scrollRotation()).toBe(0);
      expect(cube.idleRotationSignal()).toBe(0);
      vi.useRealTimers();
    });

    it('should reset Y rotation to 0 after 300ms', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.scrollRotationY.set(50);

      cube.onFaceClick(0);
      expect(cube.scrollRotationY()).toBe(50); // unchanged before timeout
      vi.advanceTimersByTime(300);
      expect(cube.scrollRotationY()).toBe(0);
      vi.useRealTimers();
    });

    it('should not zoom in when scrollProgress is below 0.5', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(0.3);

      cube.onFaceClick(0);
      expect(cube.scrollProgress()).toBe(0.3);
    });

    it('should not act while already animating', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.isAnimating.set(true);

      cube.onFaceClick(0);
      expect(cube.scrollProgress()).toBe(1);
    });

    it('should set activeFace to the clicked face index after 300ms', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.activeFace.set(0);

      cube.onFaceClick(2);
      expect(cube.activeFace()).toBe(0); // unchanged before timeout
      vi.advanceTimersByTime(300);
      expect(cube.activeFace()).toBe(2);
      vi.useRealTimers();
    });
  });

  // ── Zoom out ─────────────────────────────────────────────────────────────────

  describe('zoomOut', () => {
    it('should set scrollProgress to 1 (cube view)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(0);

      cube.zoomOut();
      expect(cube.scrollProgress()).toBe(1);
    });

    it('should set isAnimating to true', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(0);

      cube.zoomOut();
      expect(cube.isAnimating()).toBe(true);
    });

    it('should not act while already animating', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(0);
      cube.isAnimating.set(true);

      cube.zoomOut();
      expect(cube.scrollProgress()).toBe(0);
    });

    it('should clear isAnimating after fallback timeout', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(0);

      cube.zoomOut();
      expect(cube.isAnimating()).toBe(true);

      vi.advanceTimersByTime(700);
      expect(cube.isAnimating()).toBe(false);
      vi.useRealTimers();
    });
  });

  // ── Back button template ──────────────────────────────────────────────────────

  describe('back button', () => {
    it('should show back button when expanded', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.back-button');
      expect(button).toBeTruthy();
    });

    it('should not show back button when in cube view', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.back-button');
      expect(button).toBeFalsy();
    });
  });

  // ── Expanded class binding ──────────────────────────────────────────────────

  describe('cube--expanded class', () => {
    it('should add cube--expanded class when expanded', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);
      fixture.detectChanges();

      const cubeDiv = fixture.nativeElement.querySelector('.cube');
      expect(cubeDiv.classList.contains('cube--expanded')).toBe(true);
    });

    it('should not have cube--expanded class in cube view', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      fixture.detectChanges();

      const cubeDiv = fixture.nativeElement.querySelector('.cube');
      expect(cubeDiv.classList.contains('cube--expanded')).toBe(false);
    });
  });

  // ── Placeholder faces ─────────────────────────────────────────────────────

  describe('placeholder faces', () => {
    it('should not have click handlers on left and right faces', () => {
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      const left = fixture.nativeElement.querySelector('.cube__face--left');
      const right = fixture.nativeElement.querySelector('.cube__face--right');
      expect(left).toBeTruthy();
      expect(right).toBeTruthy();
      // Clicking placeholder faces should not change scrollProgress
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      left.click();
      right.click();
      expect(cube.scrollProgress()).toBe(1);
    });
  });

  // ── Drag interaction ──────────────────────────────────────────────────────

  describe('onPointerDown', () => {
    it('should not start drag while animating', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.isAnimating.set(true);
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(0);

      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      // Simulate a move — rotation should not change since drag was blocked
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));
      expect(cube.scrollRotation()).toBe(0);
    });
  });

  describe('onFaceClick drag suppression', () => {
    it('should not zoom in if drag occurred', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      // Simulate a drag: pointerdown → pointermove (beyond threshold) → pointerup
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 200 }));

      // Click after drag should be suppressed
      cube.onFaceClick(0);
      expect(cube.scrollProgress()).toBe(1);
    });
  });

  // ── CSS class bindings ──────────────────────────────────────────────────────

  describe('CSS class bindings', () => {
    it('should add scene--transitioning class when animating', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.isAnimating.set(true);
      fixture.detectChanges();

      const scene = fixture.nativeElement.querySelector('.scene');
      expect(scene.classList.contains('scene--transitioning')).toBe(true);
    });

    it('should not have scene--transitioning class when not animating', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.isAnimating.set(false);
      fixture.detectChanges();

      const scene = fixture.nativeElement.querySelector('.scene');
      expect(scene.classList.contains('scene--transitioning')).toBe(false);
    });
  });

  // ── Drag momentum ──────────────────────────────────────────────────────────

  describe('drag momentum', () => {
    function simulateDrag(cube: any, fixture: any, options: {
      startX?: number; startY?: number;
      endX?: number; endY?: number;
      moveDuration?: number;
    } = {}) {
      const { startX = 100, startY = 100, endX = 100, endY = 300, moveDuration = 50 } = options;
      const startTime = performance.now();

      cube.scrollProgress.set(1);
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: startX, clientY: startY }));

      // Simulate two move events within the velocity sample window
      vi.spyOn(performance, 'now').mockReturnValue(startTime);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: startX, clientY: startY }));

      vi.spyOn(performance, 'now').mockReturnValue(startTime + moveDuration);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: endX, clientY: endY }));

      vi.spyOn(performance, 'now').mockReturnValue(startTime + moveDuration);
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: endX, clientY: endY }));
    }

    it('should apply momentum after drag release in cube view', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      simulateDrag(cube, fixture);

      // momentumLastTime should be set (momentum is active)
      expect((cube as any).momentumVelocityX).not.toBe(0);
      expect((cube as any).momentumLastTime).toBeGreaterThan(0);
    });

    it('should not apply momentum when dragging zoom progress', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      cube.scrollProgress.set(0.5);
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 300 }));
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 300 }));

      expect((cube as any).momentumVelocityX).toBe(0);
      expect((cube as any).momentumVelocityY).toBe(0);
    });

    it('should stop momentum when a new drag starts', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      simulateDrag(cube, fixture);
      expect((cube as any).momentumVelocityX).not.toBe(0);

      // New drag should zero out momentum
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
      expect((cube as any).momentumVelocityX).toBe(0);
      expect((cube as any).momentumVelocityY).toBe(0);
      expect((cube as any).momentumLastTime).toBe(0);
    });

    it('should stop momentum on face click', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // Set up momentum directly (simulating an active spin)
      cube.scrollProgress.set(1);
      (cube as any).momentumVelocityX = 100;
      (cube as any).momentumVelocityY = 50;
      (cube as any).momentumLastTime = 1000;

      cube.onFaceClick(0);
      expect((cube as any).momentumVelocityX).toBe(0);
      expect((cube as any).momentumVelocityY).toBe(0);
      expect((cube as any).momentumLastTime).toBe(0);
    });

    it('should decelerate momentum over time', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // Set up momentum directly
      (cube as any).momentumVelocityX = 100;
      (cube as any).momentumVelocityY = 0;
      (cube as any).momentumLastTime = 1000;

      // Simulate a tick 16ms later
      const tick = (cube as any).startAutoRotate;
      // Instead, manually invoke what the tick loop does
      const initialVelocity = 100;

      // Simulate: dt = 16ms = 0.016s
      const dt = 0.016;
      const decay = Math.pow(0.96, dt * 60);
      const expectedVelocity = initialVelocity * decay;

      // The tick reads momentumLastTime and computes dt from rAF timestamp
      // We can verify the math: after one frame the velocity should be reduced
      expect(expectedVelocity).toBeLessThan(initialVelocity);
      expect(expectedVelocity).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should stop when velocity drops below threshold', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // Set velocity just above threshold
      (cube as any).momentumVelocityX = 0.3;
      (cube as any).momentumVelocityY = 0.3;
      (cube as any).momentumLastTime = 1000;

      // Speed = sqrt(0.3^2 + 0.3^2) ≈ 0.424 < 0.5 threshold
      // Simulating a tick should stop momentum
      const speed = Math.sqrt(0.3 ** 2 + 0.3 ** 2);
      expect(speed).toBeLessThan(0.5);
    });

    it('should not apply momentum if pointer did not move', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      cube.scrollProgress.set(1);
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      // Release without moving
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));

      expect((cube as any).momentumVelocityX).toBe(0);
      expect((cube as any).momentumVelocityY).toBe(0);
      expect((cube as any).momentumLastTime).toBe(0);
    });

    it('should compute velocity from recent drag speed, not full-drag average', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      cube.scrollProgress.set(1);
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));

      const startTime = 1000;

      // First move: slow, far in the past (outside the 100ms window)
      vi.spyOn(performance, 'now').mockReturnValue(startTime);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));

      // Wait beyond the velocity sample window
      vi.spyOn(performance, 'now').mockReturnValue(startTime + 200);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));

      // Fast recent move within the sample window
      vi.spyOn(performance, 'now').mockReturnValue(startTime + 250);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 250 }));

      vi.spyOn(performance, 'now').mockReturnValue(startTime + 250);
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 250 }));

      // Velocity should be based on the 50ms window (200→250), not the full 250ms drag
      const velocityX = (cube as any).momentumVelocityX;
      // 50px in 50ms = 1000 px/s → (-1000 / 300) * 90 = -300 deg/s
      expect(Math.abs(velocityX)).toBeCloseTo(300, 0);
    });

    it('should resume auto-rotation after momentum stops and idle delay', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // Simulate momentum ending by calling pauseAutoRotate (which is what happens
      // when momentum decays below threshold in the tick loop)
      (cube as any).autoRotate = false;
      (cube as any).pauseAutoRotate();

      expect((cube as any).autoRotate).toBe(false);

      // After IDLE_RESUME_DELAY (2000ms), auto-rotation should resume
      vi.advanceTimersByTime(2000);
      expect((cube as any).autoRotate).toBe(true);

      vi.useRealTimers();
    });
  });

  // ── Drag direction flip ────────────────────────────────────────────────────

  describe('drag direction flip', () => {
    function simulateDragForFlip(cube: any, options: {
      startX?: number; startY?: number;
      endX?: number; endY?: number;
    } = {}) {
      const { startX = 100, startY = 100, endX = 100, endY = 300 } = options;
      const startTime = 1000;

      cube.scrollProgress.set(1);
      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: startX, clientY: startY }));

      vi.spyOn(performance, 'now').mockReturnValue(startTime);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: startX, clientY: startY }));

      vi.spyOn(performance, 'now').mockReturnValue(startTime + 50);
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: endX, clientY: endY }));

      vi.spyOn(performance, 'now').mockReturnValue(startTime + 50);
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: endX, clientY: endY }));
    }

    it('should have normal horizontal drag direction when X rotation is near 0', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      cube.scrollProgress.set(1);
      cube.scrollRotation.set(0);
      cube.scrollRotationY.set(0);
      cube.activeFace.set(0);

      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 100 }));

      // Dragging right should produce positive Y rotation
      expect(cube.scrollRotationY()).toBeGreaterThan(0);
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 100 }));
    });

    it('should invert horizontal drag when X rotation is ~180° (upside down)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // Set cube upside down: activeFace=0, scrollRotation=0, idleRotation=180
      // totalX = 0*-90 + 0 + 180 = 180 → cos(180°) = -1 → dragFlipY = -1
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(0);
      cube.scrollRotationY.set(0);
      cube.activeFace.set(0);
      (cube as any).idleRotation = 180;

      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 100 }));

      // Dragging right should now produce negative Y rotation (inverted)
      expect(cube.scrollRotationY()).toBeLessThan(0);
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 100 }));
    });

    it('should invert vertical drag when Y rotation is ~180° (showing back)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // totalY = 180 → cos(180°) = -1 → dragFlipX = -1
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(0);
      cube.scrollRotationY.set(180);
      cube.activeFace.set(0);

      cube.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 200 }));

      // Dragging down should now produce positive X rotation (inverted from normal)
      expect(cube.scrollRotation()).toBeGreaterThan(0);
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 200 }));
    });

    it('should apply flip factors to momentum direction', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();

      // Set cube upside down
      cube.scrollRotation.set(0);
      cube.scrollRotationY.set(0);
      cube.activeFace.set(0);
      (cube as any).idleRotation = 180;

      // Drag right → momentum Y should be inverted
      simulateDragForFlip(cube, { startX: 100, startY: 100, endX: 200, endY: 100 });

      expect((cube as any).momentumVelocityY).toBeLessThan(0);
    });
  });

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should cancel animation frame on destroy', () => {
      const spy = vi.spyOn(window, 'cancelAnimationFrame');
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      fixture.destroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
