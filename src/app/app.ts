import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('cube') private cubeRef!: ElementRef<HTMLDivElement>;
  private zoomed = false;
  private wheelListener!: (e: WheelEvent) => void;

  ngAfterViewInit(): void {
    const cube = this.cubeRef.nativeElement;

    gsap.set(cube, { scale: 0.35, scaleZ: 0.35 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        snap: {
          snapTo: 1 / 3,
          duration: 0.5,
          ease: 'power2.inOut',
        },
      },
    });

    tl.to(cube, { rotateX: -270, ease: 'none', duration: 3 });

    this.wheelListener = () => {
      if (this.zoomed) {
        this.zoomed = false;
        gsap.to(cube, { scale: 0.35, scaleZ: 0.35, duration: 0.5, ease: 'power2.inOut' });
      }
    };
    window.addEventListener('wheel', this.wheelListener, { passive: true });
  }

  onSceneClick(): void {
    if (!this.zoomed) {
      this.zoomed = true;
      gsap.to(this.cubeRef.nativeElement, { scale: 1, scaleZ: 1, duration: 0.8, ease: 'power2.inOut' });
    }
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
    window.removeEventListener('wheel', this.wheelListener);
  }
}
