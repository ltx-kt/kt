import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeAll(() => {
    (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
    HTMLCanvasElement.prototype.getContext = () => ({
      clearRect() {}, beginPath() {}, arc() {}, fill() {},
      set fillStyle(_: any) {}, set globalAlpha(_: any) {},
    } as any);
  });
  afterAll(() => {
    delete (globalThis as any).ResizeObserver;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the cube component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const cube = fixture.nativeElement.querySelector('app-cube');
    expect(cube).toBeTruthy();
  });
});
