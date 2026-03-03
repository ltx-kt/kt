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
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      expect(cube.scrollProgress()).toBe(0);
    });

    it('should set isAnimating to true', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
      expect(cube.isAnimating()).toBe(true);
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

    it('should snap Y rotation to nearest 90 degrees', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.scrollRotationY.set(40);

      cube.onFaceClick(0);
      expect(cube.scrollRotationY()).toBe(0);
    });

    it('should snap Y rotation to 90 when closer to 90', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.scrollRotationY.set(50);

      cube.onFaceClick(0);
      expect(cube.scrollRotationY()).toBe(90);
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

    it('should snap activeFace to nearest face based on total rotation', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);
      cube.activeFace.set(0);
      cube.scrollRotation.set(-85); // close to face 1 (-90°)

      cube.onFaceClick(0);
      expect(cube.activeFace()).toBe(1);
    });

    it('should clear isAnimating after fallback timeout', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      fixture.detectChanges();
      cube.scrollProgress.set(1);

      cube.onFaceClick(0);
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
