import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

const PARTICLE_COUNT = 60;
const MIN_RADIUS = 1;
const MAX_RADIUS = 3;
const SPEED = 0.3;
const MIN_OPACITY = 0.15;
const MAX_OPACITY = 0.45;
const COLORS = ['#a78bfa', '#60a5fa', '#c4b5fd', '#2dd4bf'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
}

@Component({
  selector: 'app-particles',
  templateUrl: './particles.html',
  styleUrl: './particles.scss',
})
export class Particles implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId = 0;
  private observer!: ResizeObserver;

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(document.documentElement);
    this.resize();

    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.observer.disconnect();
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.initParticles();
  }

  private initParticles(): void {
    const w = this.canvasRef.nativeElement.width;
    const h = this.canvasRef.nativeElement.height;
    this.particles = Array.from({ length: PARTICLE_COUNT }, () => this.createParticle(w, h));
  }

  private createParticle(w: number, h: number): Particle {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
    };
  }

  private animate = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.width;
    const h = canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -p.radius) p.x = w + p.radius;
      else if (p.x > w + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = h + p.radius;
      else if (p.y > h + p.radius) p.y = -p.radius;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
    this.rafId = requestAnimationFrame(this.animate);
  };
}
