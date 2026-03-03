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
      expect(texts).toEqual(['About', 'Projects', 'Contact', '?', '?']);
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
      vi.advanceTimersByTime(16);
      expect(cube.scrollProgress()).toBe(0);
      vi.useRealTimers();
    });

    it('should set isAnimating to true after snap renders', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      expect(cube.isAnimating()).toBe(false);
      vi.advanceTimersByTime(16);
      expect(cube.isAnimating()).toBe(true);
      vi.useRealTimers();
    });

    it('should reset scrollRotation and idleRotationSignal', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(45);
      cube.idleRotationSignal.set(10);

      cube.onFaceClick(0);
      expect(cube.scrollRotation()).toBe(0);
      expect(cube.idleRotationSignal()).toBe(0);
    });

    it('should reset Y rotation to 0', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.scrollRotationY.set(50);

      cube.onFaceClick(0);
      expect(cube.scrollRotationY()).toBe(0);
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

    it('should set activeFace to the clicked face index', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.activeFace.set(0);

      cube.onFaceClick(2);
      expect(cube.activeFace()).toBe(2);
    });

    it('should clear isAnimating after fallback timeout', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      vi.advanceTimersByTime(16);
      expect(cube.isAnimating()).toBe(true);

      vi.advanceTimersByTime(700);
      expect(cube.isAnimating()).toBe(false);
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
