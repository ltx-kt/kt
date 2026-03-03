import { Component } from '@angular/core';
import { Cube } from './cube/cube';

@Component({
  selector: 'app-root',
  imports: [Cube],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
