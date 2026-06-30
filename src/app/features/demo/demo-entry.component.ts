import { Component, OnInit, inject } from '@angular/core';
import { DemoModeService } from '../../core/demo-mode.service';

@Component({ selector: 'app-demo-entry', standalone: true, template: '' })
export class DemoEntryComponent implements OnInit {
  private demoMode = inject(DemoModeService);

  ngOnInit() {
    this.demoMode.enter();
  }
}
