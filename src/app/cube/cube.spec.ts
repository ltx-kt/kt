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

    it('should render all four cube faces', () => {
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      const faces = fixture.nativeElement.querySelectorAll('.cube__face');
      expect(faces.length).toBe(4);
    });

    it('should render About, Projects, and Contact headings', () => {
      const fixture = TestBed.createComponent(Cube);
      fixture.detectChanges();
      const headings = fixture.nativeElement.querySelectorAll('.face-heading');
      const texts = Array.from(headings).map((h: any) => h.textContent.trim());
      expect(texts).toEqual(['About', 'Projects', 'Contact']);
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
    it('should return 1 when scrollProgress is 0 (fully expanded)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);
      expect(cube.cubeScale()).toBe(1);
    });

    it('should return 0.35 when scrollProgress is 1 (cube view)', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      expect(cube.cubeScale()).toBe(0.35);
    });

    it('should interpolate between 1 and 0.35 during zoom', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);
      expect(cube.cubeScale()).toBeCloseTo(0.675, 3);
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

  // ── Wheel interaction ───────────────────────────────────────────────────────

  describe('onWheel', () => {
    it('should increase scrollProgress when scrolling down during zoom phase', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);

      cube.onWheel(new WheelEvent('wheel', { deltaY: 100 }));
      expect(cube.scrollProgress()).toBeGreaterThan(0.5);
    });

    it('should decrease scrollProgress when scrolling up during zoom phase', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);

      cube.onWheel(new WheelEvent('wheel', { deltaY: -100 }));
      expect(cube.scrollProgress()).toBeLessThan(0.5);
    });

    it('should clamp scrollProgress to 0 minimum', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0);

      cube.onWheel(new WheelEvent('wheel', { deltaY: -9999 }));
      expect(cube.scrollProgress()).toBe(0);
    });

    it('should clamp scrollProgress to 1 maximum during zoom phase', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.99);

      cube.onWheel(new WheelEvent('wheel', { deltaY: 9999 }));
      expect(cube.scrollProgress()).toBe(1);
    });

    it('should rotate cube when scrollProgress is 1', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(1);
      cube.scrollRotation.set(0);

      cube.onWheel(new WheelEvent('wheel', { deltaY: 100 }));
      expect(cube.scrollRotation()).not.toBe(0);
    });

    it('should ignore wheel events while animating', () => {
      const fixture = TestBed.createComponent(Cube);
      const cube = fixture.componentInstance;
      cube.scrollProgress.set(0.5);
      cube.isAnimating.set(true);

      cube.onWheel(new WheelEvent('wheel', { deltaY: 100 }));
      expect(cube.scrollProgress()).toBe(0.5);
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
