import { Component, signal } from '@angular/core';
import { Cube } from './cube/cube';
import { Banner } from './banner/banner';
import { Particles } from './particles/particles';

@Component({
  selector: 'app-root',
  imports: [Cube, Banner, Particles],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  cubeExpanded = signal(false);
}
