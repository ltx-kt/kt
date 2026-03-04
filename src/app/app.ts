import { Component, signal } from '@angular/core';
import { Cube } from './cube/cube';
import { Banner } from './banner/banner';

@Component({
  selector: 'app-root',
  imports: [Cube, Banner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  cubeExpanded = signal(false);
}
