import { Component } from '@angular/core';
import { EXPERIENCE } from './experience';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  readonly experience = EXPERIENCE;
}
