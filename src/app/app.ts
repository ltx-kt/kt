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

  ngAfterViewInit(): void {
    gsap.to(this.cubeRef.nativeElement, {
      rotateX: -270,
      ease: 'none',
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
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
