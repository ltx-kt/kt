import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
})
export class Banner {
  cubeExpanded = input<boolean>(false);
  visible = computed(() => !this.cubeExpanded());
}
